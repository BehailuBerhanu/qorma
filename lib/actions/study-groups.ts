'use server'

import { db } from '@/lib/db'
import {
  studyGroup, studyGroupSubject, groupMembership, groupPost, groupComment,
  groupChallenge, challengeQuestion, challengeAttempt, challengeAnswer,
  contentReport, question, option,
} from '@/lib/db/schema'
import { eq, and, inArray, count } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  return session.user
}

// ─── Membership helpers ──────────────────────────────────────────────────────

async function getMembership(groupId: number, userId: string) {
  const [row] = await db
    .select()
    .from(groupMembership)
    .where(and(eq(groupMembership.groupId, groupId), eq(groupMembership.userId, userId)))
    .limit(1)
  return row ?? null
}

async function requireMember(groupId: number, userId: string) {
  const m = await getMembership(groupId, userId)
  if (!m) throw new Error('Not a member of this group')
  return m
}

async function requireAdminOrOwner(groupId: number, userId: string) {
  const m = await getMembership(groupId, userId)
  if (!m || (m.role !== 'admin' && m.role !== 'owner')) {
    throw new Error('Insufficient permissions')
  }
  return m
}

async function requireOwner(groupId: number, userId: string) {
  const m = await getMembership(groupId, userId)
  if (!m || m.role !== 'owner') throw new Error('Only the owner can do this')
  return m
}

// ─── Create group ─────────────────────────────────────────────────────────────

export async function createStudyGroup(data: {
  name: string
  description?: string
  examId?: number
  subjectIds: number[]
  privacy: 'public' | 'private'
  goal?: string
}): Promise<{ groupId: number }> {
  const user = await requireUser()

  const token =
    data.privacy === 'private' ? randomBytes(24).toString('hex') : null

  const [created] = await db
    .insert(studyGroup)
    .values({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      examId: data.examId ?? null,
      ownerId: user.id,
      privacy: data.privacy,
      goal: data.goal?.trim() || null,
      inviteToken: token,
    })
    .returning({ id: studyGroup.id })

  // Add creator as owner member
  await db.insert(groupMembership).values({
    groupId: created.id,
    userId: user.id,
    role: 'owner',
  })

  // Add subjects
  if (data.subjectIds.length > 0) {
    await db.insert(studyGroupSubject).values(
      data.subjectIds.map((sid) => ({ groupId: created.id, subjectId: sid }))
    )
  }

  revalidatePath('/study-groups')
  return { groupId: created.id }
}

// ─── Join group (public) ──────────────────────────────────────────────────────

export async function joinStudyGroup(groupId: number): Promise<void> {
  const user = await requireUser()

  const [grp] = await db
    .select({ privacy: studyGroup.privacy })
    .from(studyGroup)
    .where(eq(studyGroup.id, groupId))
    .limit(1)

  if (!grp) throw new Error('Group not found')
  if (grp.privacy !== 'public') throw new Error('This group is private. Use an invite link.')

  await db
    .insert(groupMembership)
    .values({ groupId, userId: user.id, role: 'member' })
    .onConflictDoNothing()

  revalidatePath(`/study-groups/${groupId}`)
  revalidatePath('/study-groups')
}

// ─── Join via invite token ────────────────────────────────────────────────────

export async function joinGroupByToken(token: string): Promise<{ groupId: number }> {
  const user = await requireUser()

  const [grp] = await db
    .select({ id: studyGroup.id, privacy: studyGroup.privacy })
    .from(studyGroup)
    .where(eq(studyGroup.inviteToken, token))
    .limit(1)

  if (!grp) throw new Error('Invalid or expired invite link')

  await db
    .insert(groupMembership)
    .values({ groupId: grp.id, userId: user.id, role: 'member' })
    .onConflictDoNothing()

  revalidatePath(`/study-groups/${grp.id}`)
  revalidatePath('/study-groups')
  return { groupId: grp.id }
}

// ─── Leave group ──────────────────────────────────────────────────────────────

export async function leaveStudyGroup(groupId: number): Promise<void> {
  const user = await requireUser()
  const m = await requireMember(groupId, user.id)
  if (m.role === 'owner') throw new Error('Owner cannot leave. Transfer ownership or delete the group first.')

  await db
    .delete(groupMembership)
    .where(and(eq(groupMembership.groupId, groupId), eq(groupMembership.userId, user.id)))

  revalidatePath('/study-groups')
}

// ─── Update group (admin/owner) ───────────────────────────────────────────────

export async function updateStudyGroup(
  groupId: number,
  data: {
    name?: string
    description?: string
    goal?: string
    privacy?: 'public' | 'private'
    subjectIds?: number[]
  }
): Promise<void> {
  const user = await requireUser()
  await requireAdminOrOwner(groupId, user.id)

  const updates: Partial<typeof studyGroup.$inferInsert> = {}
  if (data.name !== undefined) updates.name = data.name.trim()
  if (data.description !== undefined) updates.description = data.description.trim() || null
  if (data.goal !== undefined) updates.goal = data.goal.trim() || null
  if (data.privacy !== undefined) {
    updates.privacy = data.privacy
    if (data.privacy === 'private') {
      const [existing] = await db
        .select({ inviteToken: studyGroup.inviteToken })
        .from(studyGroup)
        .where(eq(studyGroup.id, groupId))
        .limit(1)
      if (!existing?.inviteToken) {
        updates.inviteToken = randomBytes(24).toString('hex')
      }
    }
  }
  updates.updatedAt = new Date()

  await db.update(studyGroup).set(updates).where(eq(studyGroup.id, groupId))

  if (data.subjectIds !== undefined) {
    await db.delete(studyGroupSubject).where(eq(studyGroupSubject.groupId, groupId))
    if (data.subjectIds.length > 0) {
      await db.insert(studyGroupSubject).values(
        data.subjectIds.map((sid) => ({ groupId, subjectId: sid }))
      )
    }
  }

  revalidatePath(`/study-groups/${groupId}`)
}

// ─── Regenerate invite token ─────────────────────────────────────────────────

export async function regenerateInviteToken(groupId: number): Promise<{ token: string }> {
  const user = await requireUser()
  await requireAdminOrOwner(groupId, user.id)

  const token = randomBytes(24).toString('hex')
  await db.update(studyGroup).set({ inviteToken: token }).where(eq(studyGroup.id, groupId))

  revalidatePath(`/study-groups/${groupId}`)
  return { token }
}

// ─── Delete group (owner only) ────────────────────────────────────────────────

export async function deleteStudyGroup(groupId: number): Promise<void> {
  const user = await requireUser()
  await requireOwner(groupId, user.id)

  await db.delete(studyGroup).where(eq(studyGroup.id, groupId))
  revalidatePath('/study-groups')
}

// ─── Change member role ───────────────────────────────────────────────────────

export async function changeMemberRole(
  groupId: number,
  targetUserId: string,
  newRole: 'admin' | 'member'
): Promise<void> {
  const user = await requireUser()
  await requireOwner(groupId, user.id)

  const [target] = await db
    .select()
    .from(groupMembership)
    .where(and(eq(groupMembership.groupId, groupId), eq(groupMembership.userId, targetUserId)))
    .limit(1)

  if (!target || target.role === 'owner') throw new Error('Cannot modify this member')

  await db
    .update(groupMembership)
    .set({ role: newRole })
    .where(and(eq(groupMembership.groupId, groupId), eq(groupMembership.userId, targetUserId)))

  revalidatePath(`/study-groups/${groupId}`)
}

// ─── Remove member ────────────────────────────────────────────────────────────

export async function removeMember(groupId: number, targetUserId: string): Promise<void> {
  const user = await requireUser()
  await requireAdminOrOwner(groupId, user.id)

  const [target] = await db
    .select()
    .from(groupMembership)
    .where(and(eq(groupMembership.groupId, groupId), eq(groupMembership.userId, targetUserId)))
    .limit(1)

  if (!target || target.role === 'owner') throw new Error('Cannot remove the owner')

  // Admins can only remove members, not other admins
  const myMembership = await getMembership(groupId, user.id)
  if (myMembership?.role === 'admin' && target.role === 'admin') {
    throw new Error('Admins cannot remove other admins')
  }

  await db
    .delete(groupMembership)
    .where(and(eq(groupMembership.groupId, groupId), eq(groupMembership.userId, targetUserId)))

  revalidatePath(`/study-groups/${groupId}`)
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function createPost(
  groupId: number,
  content: string,
  questionId?: number
): Promise<{ postId: number }> {
  const user = await requireUser()
  await requireMember(groupId, user.id)

  const [created] = await db
    .insert(groupPost)
    .values({
      groupId,
      userId: user.id,
      content: content.trim(),
      questionId: questionId ?? null,
    })
    .returning({ id: groupPost.id })

  revalidatePath(`/study-groups/${groupId}`)
  return { postId: created.id }
}

export async function deletePost(groupId: number, postId: number): Promise<void> {
  const user = await requireUser()

  const [post] = await db
    .select()
    .from(groupPost)
    .where(and(eq(groupPost.id, postId), eq(groupPost.groupId, groupId)))
    .limit(1)

  if (!post) throw new Error('Post not found')

  // Own post OR admin/owner can delete
  if (post.userId !== user.id) {
    await requireAdminOrOwner(groupId, user.id)
  }

  await db.delete(groupPost).where(eq(groupPost.id, postId))
  revalidatePath(`/study-groups/${groupId}`)
}

export async function pinPost(groupId: number, postId: number, pinned: boolean): Promise<void> {
  const user = await requireUser()
  await requireAdminOrOwner(groupId, user.id)

  await db
    .update(groupPost)
    .set({ isPinned: pinned })
    .where(and(eq(groupPost.id, postId), eq(groupPost.groupId, groupId)))

  revalidatePath(`/study-groups/${groupId}`)
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function createComment(
  groupId: number,
  postId: number,
  content: string
): Promise<{ commentId: number }> {
  const user = await requireUser()
  await requireMember(groupId, user.id)

  // Verify post belongs to group
  const [post] = await db
    .select()
    .from(groupPost)
    .where(and(eq(groupPost.id, postId), eq(groupPost.groupId, groupId)))
    .limit(1)
  if (!post) throw new Error('Post not found')

  const [created] = await db
    .insert(groupComment)
    .values({ postId, userId: user.id, content: content.trim() })
    .returning({ id: groupComment.id })

  revalidatePath(`/study-groups/${groupId}`)
  return { commentId: created.id }
}

export async function deleteComment(groupId: number, commentId: number): Promise<void> {
  const user = await requireUser()

  const [comment] = await db
    .select({ userId: groupComment.userId, postId: groupComment.postId })
    .from(groupComment)
    .where(eq(groupComment.id, commentId))
    .limit(1)

  if (!comment) throw new Error('Comment not found')

  if (comment.userId !== user.id) {
    await requireAdminOrOwner(groupId, user.id)
  }

  await db.delete(groupComment).where(eq(groupComment.id, commentId))
  revalidatePath(`/study-groups/${groupId}`)
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export async function createChallenge(
  groupId: number,
  data: {
    title: string
    description?: string
    subjectId?: number
    examId?: number
    questionCount: number
    timeLimitMins: number
    startAt: Date
    endAt: Date
  }
): Promise<{ challengeId: number }> {
  const user = await requireUser()
  await requireAdminOrOwner(groupId, user.id)

  const [created] = await db
    .insert(groupChallenge)
    .values({
      groupId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      subjectId: data.subjectId ?? null,
      examId: data.examId ?? null,
      questionCount: data.questionCount,
      timeLimitMins: data.timeLimitMins,
      createdBy: user.id,
      startAt: data.startAt,
      endAt: data.endAt,
    })
    .returning({ id: groupChallenge.id })

  // Pick random questions from the specified exam+subject
  if (data.subjectId || data.examId) {
    const conditions = []
    if (data.examId) conditions.push(eq(question.examId, data.examId))
    if (data.subjectId) conditions.push(eq(question.subjectId, data.subjectId))

    const available = await db
      .select({ id: question.id })
      .from(question)
      .where(conditions.length === 2 ? and(...(conditions as [ReturnType<typeof eq>, ReturnType<typeof eq>])) : conditions[0])
      .limit(data.questionCount * 3) // fetch more, then sample

    // Fisher-Yates shuffle then take requested count
    const shuffled = [...available].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, data.questionCount)

    if (selected.length > 0) {
      await db.insert(challengeQuestion).values(
        selected.map((q, i) => ({
          challengeId: created.id,
          questionId: q.id,
          orderIndex: i + 1,
        }))
      )
    }
  }

  revalidatePath(`/study-groups/${groupId}`)
  return { challengeId: created.id }
}

// ─── Challenge attempt ────────────────────────────────────────────────────────

export async function startChallengeAttempt(
  challengeId: number
): Promise<{ attemptId: number }> {
  const user = await requireUser()

  // Verify user is member of the group owning the challenge
  const [challenge] = await db
    .select({ groupId: groupChallenge.groupId, questionCount: groupChallenge.questionCount })
    .from(groupChallenge)
    .where(eq(groupChallenge.id, challengeId))
    .limit(1)
  if (!challenge) throw new Error('Challenge not found')

  await requireMember(challenge.groupId, user.id)

  const [existing] = await db
    .select({ id: challengeAttempt.id })
    .from(challengeAttempt)
    .where(
      and(
        eq(challengeAttempt.challengeId, challengeId),
        eq(challengeAttempt.userId, user.id)
      )
    )
    .limit(1)

  if (existing) return { attemptId: existing.id }

  const [created] = await db
    .insert(challengeAttempt)
    .values({
      challengeId,
      userId: user.id,
      total: challenge.questionCount,
    })
    .returning({ id: challengeAttempt.id })

  return { attemptId: created.id }
}

export type ChallengeAnswerResult = {
  isCorrect: boolean
  correctOptionId: number
  explanation: string | null
}

export async function submitChallengeAnswer(
  attemptId: number,
  questionId: number,
  selectedOptionId: number
): Promise<ChallengeAnswerResult> {
  const user = await requireUser()

  // Verify attempt belongs to user
  const [attempt] = await db
    .select()
    .from(challengeAttempt)
    .where(and(eq(challengeAttempt.id, attemptId), eq(challengeAttempt.userId, user.id)))
    .limit(1)
  if (!attempt) throw new Error('Attempt not found')
  if (attempt.completedAt) throw new Error('Attempt already completed')

  // Prevent double-answer
  const [existing] = await db
    .select({ id: challengeAnswer.id, isCorrect: challengeAnswer.isCorrect })
    .from(challengeAnswer)
    .where(
      and(
        eq(challengeAnswer.attemptId, attemptId),
        eq(challengeAnswer.questionId, questionId)
      )
    )
    .limit(1)

  const [correctOpt] = await db
    .select({ id: option.id })
    .from(option)
    .where(and(eq(option.questionId, questionId), eq(option.isCorrect, true)))
    .limit(1)

  const [q] = await db
    .select({ explanation: question.explanation })
    .from(question)
    .where(eq(question.id, questionId))
    .limit(1)

  if (existing) {
    return {
      isCorrect: existing.isCorrect,
      correctOptionId: correctOpt?.id ?? selectedOptionId,
      explanation: q?.explanation ?? null,
    }
  }

  const [selected] = await db
    .select({ isCorrect: option.isCorrect })
    .from(option)
    .where(eq(option.id, selectedOptionId))
    .limit(1)

  const isCorrect = selected?.isCorrect ?? false

  await db.insert(challengeAnswer).values({
    attemptId,
    questionId,
    selectedOptionId,
    isCorrect,
  })

  return {
    isCorrect,
    correctOptionId: correctOpt?.id ?? selectedOptionId,
    explanation: q?.explanation ?? null,
  }
}

export async function completeChallengeAttempt(
  attemptId: number,
  timeTakenMs: number
): Promise<void> {
  const user = await requireUser()

  const [attempt] = await db
    .select()
    .from(challengeAttempt)
    .where(and(eq(challengeAttempt.id, attemptId), eq(challengeAttempt.userId, user.id)))
    .limit(1)
  if (!attempt || attempt.completedAt) return

  // Count correct answers
  const [correctRow] = await db
    .select({ cnt: count() })
    .from(challengeAnswer)
    .where(and(eq(challengeAnswer.attemptId, attemptId), eq(challengeAnswer.isCorrect, true)))

  const correct = Number(correctRow?.cnt ?? 0)
  const accuracy = attempt.total > 0 ? Math.round((correct / attempt.total) * 100) : 0

  await db
    .update(challengeAttempt)
    .set({
      score: correct,
      accuracy,
      timeTakenMs,
      completedAt: new Date(),
    })
    .where(eq(challengeAttempt.id, attemptId))

  // Update group updatedAt for discovery
  const [challenge] = await db
    .select({ groupId: groupChallenge.groupId })
    .from(groupChallenge)
    .where(eq(groupChallenge.id, attempt.challengeId))
    .limit(1)

  if (challenge) {
    await db
      .update(studyGroup)
      .set({ updatedAt: new Date() })
      .where(eq(studyGroup.id, challenge.groupId))
  }

  revalidatePath(`/study-groups`)
}

// ─── Report content ────────────────────────────────────────────────────────────

export async function reportContent(data: {
  postId?: number
  commentId?: number
  reason: string
}): Promise<void> {
  const user = await requireUser()

  await db.insert(contentReport).values({
    reporterId: user.id,
    postId: data.postId ?? null,
    commentId: data.commentId ?? null,
    reason: data.reason,
  })
}
