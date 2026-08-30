import { db } from '@/lib/db'
import {
  studyGroup, studyGroupSubject, groupMembership, groupPost, groupComment,
  groupChallenge, challengeQuestion, challengeAttempt, challengeAnswer,
  user, exam, subject, question, option, sessionAnswer, practiceSession,
} from '@/lib/db/schema'
import { eq, and, ne, desc, asc, sql, count, inArray, notInArray, isNull, isNotNull, or } from 'drizzle-orm'

// ─── My groups ───────────────────────────────────────────────────────────────

export async function getMyGroups(userId: string) {
  const memberships = await db
    .select({
      groupId: groupMembership.groupId,
      role: groupMembership.role,
      joinedAt: groupMembership.joinedAt,
    })
    .from(groupMembership)
    .where(eq(groupMembership.userId, userId))

  if (memberships.length === 0) return []

  const groupIds = memberships.map((m) => m.groupId)
  const roleMap = new Map(memberships.map((m) => [m.groupId, m.role]))

  const groups = await db
    .select({
      id: studyGroup.id,
      name: studyGroup.name,
      description: studyGroup.description,
      privacy: studyGroup.privacy,
      examId: studyGroup.examId,
      examLabel: exam.label,
      createdAt: studyGroup.createdAt,
    })
    .from(studyGroup)
    .leftJoin(exam, eq(studyGroup.examId, exam.id))
    .where(inArray(studyGroup.id, groupIds))
    .orderBy(desc(studyGroup.updatedAt))

  const memberCounts = await db
    .select({ groupId: groupMembership.groupId, cnt: count() })
    .from(groupMembership)
    .where(inArray(groupMembership.groupId, groupIds))
    .groupBy(groupMembership.groupId)

  const memberMap = new Map(memberCounts.map((r) => [r.groupId, Number(r.cnt)]))

  const groupSubjects = await db
    .select({ groupId: studyGroupSubject.groupId, subjectName: subject.name })
    .from(studyGroupSubject)
    .innerJoin(subject, eq(studyGroupSubject.subjectId, subject.id))
    .where(inArray(studyGroupSubject.groupId, groupIds))

  const subjectsMap = new Map<number, string[]>()
  for (const gs of groupSubjects) {
    const arr = subjectsMap.get(gs.groupId) ?? []
    arr.push(gs.subjectName)
    subjectsMap.set(gs.groupId, arr)
  }

  return groups.map((g) => ({
    ...g,
    role: roleMap.get(g.id) ?? 'member',
    memberCount: memberMap.get(g.id) ?? 1,
    subjects: subjectsMap.get(g.id) ?? [],
  }))
}

// ─── Discover public groups (not already a member) ───────────────────────────

export async function getDiscoverGroups(userId: string, limit = 20) {
  const myGroupIds = await db
    .select({ groupId: groupMembership.groupId })
    .from(groupMembership)
    .where(eq(groupMembership.userId, userId))

  const excludeIds = myGroupIds.map((r) => r.groupId)

  const groups = await db
    .select({
      id: studyGroup.id,
      name: studyGroup.name,
      description: studyGroup.description,
      privacy: studyGroup.privacy,
      examId: studyGroup.examId,
      examLabel: exam.label,
      createdAt: studyGroup.createdAt,
    })
    .from(studyGroup)
    .leftJoin(exam, eq(studyGroup.examId, exam.id))
    .where(
      and(
        eq(studyGroup.privacy, 'public'),
        excludeIds.length > 0 ? notInArray(studyGroup.id, excludeIds) : undefined
      )
    )
    .orderBy(desc(studyGroup.createdAt))
    .limit(limit)

  if (groups.length === 0) return []

  const groupIds = groups.map((g) => g.id)

  const memberCounts = await db
    .select({ groupId: groupMembership.groupId, cnt: count() })
    .from(groupMembership)
    .where(inArray(groupMembership.groupId, groupIds))
    .groupBy(groupMembership.groupId)

  const memberMap = new Map(memberCounts.map((r) => [r.groupId, Number(r.cnt)]))

  const groupSubjects = await db
    .select({ groupId: studyGroupSubject.groupId, subjectName: subject.name })
    .from(studyGroupSubject)
    .innerJoin(subject, eq(studyGroupSubject.subjectId, subject.id))
    .where(inArray(studyGroupSubject.groupId, groupIds))

  const subjectsMap = new Map<number, string[]>()
  for (const gs of groupSubjects) {
    const arr = subjectsMap.get(gs.groupId) ?? []
    arr.push(gs.subjectName)
    subjectsMap.set(gs.groupId, arr)
  }

  return groups.map((g) => ({
    ...g,
    memberCount: memberMap.get(g.id) ?? 0,
    subjects: subjectsMap.get(g.id) ?? [],
  }))
}

// ─── Single group with membership check ──────────────────────────────────────

export async function getGroupById(groupId: number, userId: string) {
  const [grp] = await db
    .select({
      id: studyGroup.id,
      name: studyGroup.name,
      description: studyGroup.description,
      privacy: studyGroup.privacy,
      examId: studyGroup.examId,
      examLabel: exam.label,
      examType: exam.examType,
      ownerId: studyGroup.ownerId,
      goal: studyGroup.goal,
      inviteToken: studyGroup.inviteToken,
      createdAt: studyGroup.createdAt,
    })
    .from(studyGroup)
    .leftJoin(exam, eq(studyGroup.examId, exam.id))
    .where(eq(studyGroup.id, groupId))
    .limit(1)

  if (!grp) return null

  const [membership] = await db
    .select({ role: groupMembership.role })
    .from(groupMembership)
    .where(and(eq(groupMembership.groupId, groupId), eq(groupMembership.userId, userId)))
    .limit(1)

  // Block private group access for non-members
  if (grp.privacy === 'private' && !membership) return null

  const subjects = await db
    .select({ id: subject.id, name: subject.name, slug: subject.slug, iconName: subject.iconName })
    .from(studyGroupSubject)
    .innerJoin(subject, eq(studyGroupSubject.subjectId, subject.id))
    .where(eq(studyGroupSubject.groupId, groupId))

  const [memberCountRow] = await db
    .select({ cnt: count() })
    .from(groupMembership)
    .where(eq(groupMembership.groupId, groupId))

  return {
    ...grp,
    membership: membership ?? null,
    subjects,
    memberCount: Number(memberCountRow?.cnt ?? 0),
  }
}

// ─── Group by invite token ────────────────────────────────────────────────────

export async function getGroupByInviteToken(token: string) {
  const [grp] = await db
    .select({
      id: studyGroup.id,
      name: studyGroup.name,
      description: studyGroup.description,
      privacy: studyGroup.privacy,
      examLabel: exam.label,
    })
    .from(studyGroup)
    .leftJoin(exam, eq(studyGroup.examId, exam.id))
    .where(eq(studyGroup.inviteToken, token))
    .limit(1)

  if (!grp) return null

  const [memberCountRow] = await db
    .select({ cnt: count() })
    .from(groupMembership)
    .where(eq(groupMembership.groupId, grp.id))

  return { ...grp, memberCount: Number(memberCountRow?.cnt ?? 0) }
}

// ─── Group stats (aggregate) ─────────────────────────────────────────────────

export async function getGroupStats(groupId: number) {
  const memberIds = await db
    .select({ userId: groupMembership.userId })
    .from(groupMembership)
    .where(eq(groupMembership.groupId, groupId))

  if (memberIds.length === 0) {
    return { totalAnswered: 0, avgAccuracy: 0, activeMembers: 0, memberCount: 0 }
  }

  const userIds = memberIds.map((m) => m.userId)

  // Total questions solved by all members
  const [solvedRow] = await db
    .select({ total: count(sessionAnswer.id) })
    .from(sessionAnswer)
    .innerJoin(practiceSession, eq(sessionAnswer.sessionId, practiceSession.id))
    .where(inArray(practiceSession.userId, userIds))

  // Correct answers for avg accuracy
  const [correctRow] = await db
    .select({ correct: count(sessionAnswer.id) })
    .from(sessionAnswer)
    .innerJoin(practiceSession, eq(sessionAnswer.sessionId, practiceSession.id))
    .where(and(inArray(practiceSession.userId, userIds), eq(sessionAnswer.isCorrect, true)))

  const total = Number(solvedRow?.total ?? 0)
  const correct = Number(correctRow?.correct ?? 0)
  const avgAccuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  // Active members (answered at least one question in last 7 days)
  const since = new Date()
  since.setDate(since.getDate() - 7)
  const activeMemberIds = await db
    .selectDistinct({ userId: practiceSession.userId })
    .from(sessionAnswer)
    .innerJoin(practiceSession, eq(sessionAnswer.sessionId, practiceSession.id))
    .where(
      and(
        inArray(practiceSession.userId, userIds),
        sql`${sessionAnswer.answeredAt} >= ${since}`
      )
    )

  return {
    totalAnswered: total,
    avgAccuracy,
    activeMembers: activeMemberIds.length,
    memberCount: userIds.length,
  }
}

// ─── Group members ────────────────────────────────────────────────────────────

export async function getGroupMembers(groupId: number) {
  const rows = await db
    .select({
      userId: groupMembership.userId,
      role: groupMembership.role,
      joinedAt: groupMembership.joinedAt,
      name: user.name,
      email: user.email,
    })
    .from(groupMembership)
    .innerJoin(user, eq(groupMembership.userId, user.id))
    .where(eq(groupMembership.groupId, groupId))
    .orderBy(
      sql`case ${groupMembership.role} when 'owner' then 0 when 'admin' then 1 else 2 end`,
      asc(groupMembership.joinedAt)
    )

  // Per-member question counts
  const userIds = rows.map((r) => r.userId)
  if (userIds.length === 0) return []

  const stats = await db
    .select({
      userId: practiceSession.userId,
      total: count(sessionAnswer.id),
      correct: sql<number>`sum(case when ${sessionAnswer.isCorrect} then 1 else 0 end)::int`,
    })
    .from(sessionAnswer)
    .innerJoin(practiceSession, eq(sessionAnswer.sessionId, practiceSession.id))
    .where(inArray(practiceSession.userId, userIds))
    .groupBy(practiceSession.userId)

  const statsMap = new Map(
    stats.map((s) => [
      s.userId,
      {
        total: Number(s.total),
        accuracy:
          Number(s.total) > 0
            ? Math.round((Number(s.correct ?? 0) / Number(s.total)) * 100)
            : 0,
      },
    ])
  )

  return rows.map((r) => ({
    userId: r.userId,
    name: r.name,
    email: r.email,
    role: r.role,
    joinedAt: r.joinedAt,
    totalAnswered: statsMap.get(r.userId)?.total ?? 0,
    accuracy: statsMap.get(r.userId)?.accuracy ?? 0,
  }))
}

// ─── Posts (discussion) ───────────────────────────────────────────────────────

export async function getGroupPosts(groupId: number) {
  const posts = await db
    .select({
      id: groupPost.id,
      content: groupPost.content,
      isPinned: groupPost.isPinned,
      createdAt: groupPost.createdAt,
      updatedAt: groupPost.updatedAt,
      userId: groupPost.userId,
      userName: user.name,
      questionId: groupPost.questionId,
      questionBody: question.body,
      questionOrderIndex: question.orderIndex,
      examLabel: exam.label,
      subjectName: subject.name,
    })
    .from(groupPost)
    .innerJoin(user, eq(groupPost.userId, user.id))
    .leftJoin(question, eq(groupPost.questionId, question.id))
    .leftJoin(exam, eq(question.examId, exam.id))
    .leftJoin(subject, eq(question.subjectId, subject.id))
    .where(eq(groupPost.groupId, groupId))
    .orderBy(
      desc(groupPost.isPinned),
      desc(groupPost.createdAt)
    )

  if (posts.length === 0) return []

  const postIds = posts.map((p) => p.id)
  const comments = await db
    .select({
      id: groupComment.id,
      postId: groupComment.postId,
      content: groupComment.content,
      createdAt: groupComment.createdAt,
      userId: groupComment.userId,
      userName: user.name,
    })
    .from(groupComment)
    .innerJoin(user, eq(groupComment.userId, user.id))
    .where(inArray(groupComment.postId, postIds))
    .orderBy(asc(groupComment.createdAt))

  const commentsByPost = new Map<number, typeof comments>()
  for (const c of comments) {
    const arr = commentsByPost.get(c.postId) ?? []
    arr.push(c)
    commentsByPost.set(c.postId, arr)
  }

  return posts.map((p) => ({
    ...p,
    attachedQuestion:
      p.questionId
        ? {
            questionId: p.questionId,
            body: p.questionBody ?? '',
            orderIndex: p.questionOrderIndex ?? 1,
            examLabel: p.examLabel ?? '',
            subjectName: p.subjectName ?? '',
          }
        : null,
    comments: commentsByPost.get(p.id) ?? [],
  }))
}

// ─── Active challenge for a group ────────────────────────────────────────────

export async function getActiveChallenge(groupId: number) {
  const now = new Date()
  const [challenge] = await db
    .select({
      id: groupChallenge.id,
      title: groupChallenge.title,
      description: groupChallenge.description,
      questionCount: groupChallenge.questionCount,
      timeLimitMins: groupChallenge.timeLimitMins,
      startAt: groupChallenge.startAt,
      endAt: groupChallenge.endAt,
      subjectName: subject.name,
      examLabel: exam.label,
    })
    .from(groupChallenge)
    .leftJoin(subject, eq(groupChallenge.subjectId, subject.id))
    .leftJoin(exam, eq(groupChallenge.examId, exam.id))
    .where(
      and(
        eq(groupChallenge.groupId, groupId),
        sql`${groupChallenge.startAt} <= ${now}`,
        sql`${groupChallenge.endAt} >= ${now}`
      )
    )
    .orderBy(desc(groupChallenge.startAt))
    .limit(1)

  if (!challenge) return null

  const [participantRow] = await db
    .select({ cnt: count() })
    .from(challengeAttempt)
    .where(eq(challengeAttempt.challengeId, challenge.id))

  return {
    ...challenge,
    participantCount: Number(participantRow?.cnt ?? 0),
  }
}

// ─── All challenges for a group ───────────────────────────────────────────────

export async function getGroupChallenges(groupId: number) {
  const challenges = await db
    .select({
      id: groupChallenge.id,
      title: groupChallenge.title,
      questionCount: groupChallenge.questionCount,
      timeLimitMins: groupChallenge.timeLimitMins,
      startAt: groupChallenge.startAt,
      endAt: groupChallenge.endAt,
      subjectName: subject.name,
    })
    .from(groupChallenge)
    .leftJoin(subject, eq(groupChallenge.subjectId, subject.id))
    .where(eq(groupChallenge.groupId, groupId))
    .orderBy(desc(groupChallenge.startAt))

  return challenges
}

// ─── Challenge with questions ─────────────────────────────────────────────────

export async function getChallengeWithQuestions(challengeId: number) {
  const [challenge] = await db
    .select()
    .from(groupChallenge)
    .where(eq(groupChallenge.id, challengeId))
    .limit(1)

  if (!challenge) return null

  const cqs = await db
    .select({
      questionId: challengeQuestion.questionId,
      orderIndex: challengeQuestion.orderIndex,
    })
    .from(challengeQuestion)
    .where(eq(challengeQuestion.challengeId, challengeId))
    .orderBy(asc(challengeQuestion.orderIndex))

  if (cqs.length === 0) return { challenge, questions: [] }

  const questionIds = cqs.map((cq) => cq.questionId)
  const questions = await db
    .select()
    .from(question)
    .where(inArray(question.id, questionIds))

  const allOptions = await db
    .select()
    .from(option)
    .where(inArray(option.questionId, questionIds))

  const optsByQ = new Map<number, typeof allOptions>()
  for (const opt of allOptions) {
    const arr = optsByQ.get(opt.questionId) ?? []
    arr.push(opt)
    optsByQ.set(opt.questionId, arr)
  }

  const orderMap = new Map(cqs.map((cq) => [cq.questionId, cq.orderIndex]))

  const enriched = questions
    .map((q) => ({
      ...q,
      orderIndex: orderMap.get(q.id) ?? 1,
      options: (optsByQ.get(q.id) ?? []).sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex)

  return { challenge, questions: enriched }
}

// ─── Challenge attempt ────────────────────────────────────────────────────────

export async function getChallengeAttempt(challengeId: number, userId: string) {
  const [attempt] = await db
    .select()
    .from(challengeAttempt)
    .where(
      and(
        eq(challengeAttempt.challengeId, challengeId),
        eq(challengeAttempt.userId, userId)
      )
    )
    .limit(1)

  return attempt ?? null
}

// ─── Challenge leaderboard ────────────────────────────────────────────────────

export async function getChallengeLeaderboard(challengeId: number) {
  return db
    .select({
      userId: challengeAttempt.userId,
      userName: user.name,
      score: challengeAttempt.score,
      total: challengeAttempt.total,
      accuracy: challengeAttempt.accuracy,
      timeTakenMs: challengeAttempt.timeTakenMs,
      completedAt: challengeAttempt.completedAt,
    })
    .from(challengeAttempt)
    .innerJoin(user, eq(challengeAttempt.userId, user.id))
    .where(
      and(
        eq(challengeAttempt.challengeId, challengeId),
        isNotNull(challengeAttempt.completedAt)
      )
    )
    .orderBy(desc(challengeAttempt.accuracy), asc(challengeAttempt.timeTakenMs))
}

// ─── Group leaderboard (all-time by challenge performance) ────────────────────

export async function getGroupLeaderboard(groupId: number) {
  const memberIds = await db
    .select({ userId: groupMembership.userId, userName: user.name })
    .from(groupMembership)
    .innerJoin(user, eq(groupMembership.userId, user.id))
    .where(eq(groupMembership.groupId, groupId))

  if (memberIds.length === 0) return []

  const userIds = memberIds.map((m) => m.userId)
  const nameMap = new Map(memberIds.map((m) => [m.userId, m.userName]))

  // Questions solved in practice sessions
  const practiceStats = await db
    .select({
      userId: practiceSession.userId,
      total: count(sessionAnswer.id),
      correct: sql<number>`sum(case when ${sessionAnswer.isCorrect} then 1 else 0 end)::int`,
    })
    .from(sessionAnswer)
    .innerJoin(practiceSession, eq(sessionAnswer.sessionId, practiceSession.id))
    .where(inArray(practiceSession.userId, userIds))
    .groupBy(practiceSession.userId)

  // Challenge scores
  const challengeStats = await db
    .select({
      userId: challengeAttempt.userId,
      totalChallengeScore: sql<number>`sum(${challengeAttempt.score})::int`,
      challengeCount: count(),
    })
    .from(challengeAttempt)
    .innerJoin(groupChallenge, eq(challengeAttempt.challengeId, groupChallenge.id))
    .where(
      and(
        eq(groupChallenge.groupId, groupId),
        inArray(challengeAttempt.userId, userIds),
        isNotNull(challengeAttempt.completedAt)
      )
    )
    .groupBy(challengeAttempt.userId)

  const practiceMap = new Map(practiceStats.map((s) => [s.userId, s]))
  const challengeMap = new Map(challengeStats.map((s) => [s.userId, s]))

  return userIds
    .map((uid) => {
      const p = practiceMap.get(uid)
      const c = challengeMap.get(uid)
      const total = Number(p?.total ?? 0)
      const correct = Number(p?.correct ?? 0)
      return {
        userId: uid,
        name: nameMap.get(uid) ?? 'Unknown',
        totalAnswered: total,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        challengeScore: Number(c?.totalChallengeScore ?? 0),
        challengeCount: Number(c?.challengeCount ?? 0),
      }
    })
    .sort((a, b) => b.accuracy - a.accuracy || b.totalAnswered - a.totalAnswered)
}

// ─── Question search (for post attachment) ────────────────────────────────────

export async function searchQuestions(query_: string, examId?: number, subjectId?: number, limit = 10) {
  const conditions: ReturnType<typeof eq>[] = []

  let qb = db
    .select({
      id: question.id,
      body: question.body,
      orderIndex: question.orderIndex,
      examId: question.examId,
      examLabel: exam.label,
      subjectName: subject.name,
    })
    .from(question)
    .innerJoin(exam, eq(question.examId, exam.id))
    .innerJoin(subject, eq(question.subjectId, subject.id))
    .$dynamic()

  if (examId) {
    qb = qb.where(eq(question.examId, examId))
  }
  if (subjectId) {
    qb = qb.where(eq(question.subjectId, subjectId))
  }
  if (query_) {
    qb = qb.where(sql`${question.body} ilike ${'%' + query_ + '%'}`)
  }

  return qb.limit(limit).orderBy(question.orderIndex)
}

// ─── Challenge answers (for results review) ───────────────────────────────────

export async function getChallengeAnswers(attemptId: number) {
  return db
    .select({
      questionId: challengeAnswer.questionId,
      selectedOptionId: challengeAnswer.selectedOptionId,
      isCorrect: challengeAnswer.isCorrect,
    })
    .from(challengeAnswer)
    .where(eq(challengeAnswer.attemptId, attemptId))
}
