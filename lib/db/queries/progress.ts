import { db } from '@/lib/db'
import { practiceSession, sessionAnswer, question, subject, exam, option, topic } from '@/lib/db/schema'
import { eq, and, desc, gte, sql, count, inArray } from 'drizzle-orm'

/** Dashboard stats for a user */
export async function getUserStats(userId: string) {
  const [totalRow] = await db
    .select({ total: count() })
    .from(sessionAnswer)
    .innerJoin(practiceSession, eq(sessionAnswer.sessionId, practiceSession.id))
    .where(eq(practiceSession.userId, userId))

  const [correctRow] = await db
    .select({ correct: count() })
    .from(sessionAnswer)
    .innerJoin(practiceSession, eq(sessionAnswer.sessionId, practiceSession.id))
    .where(and(eq(practiceSession.userId, userId), eq(sessionAnswer.isCorrect, true)))

  const total = Number(totalRow?.total ?? 0)
  const correct = Number(correctRow?.correct ?? 0)
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  return { totalAnswered: total, totalCorrect: correct, accuracy }
}

/** Per-subject stats for a user (for the Subject cards on dashboard) */
export async function getUserSubjectStats(userId: string) {
  const rows = await db
    .select({
      subjectId: practiceSession.subjectId,
      subjectName: subject.name,
      subjectSlug: subject.slug,
      subjectIcon: subject.iconName,
      total: count(sessionAnswer.id),
      correct: sql<number>`sum(case when ${sessionAnswer.isCorrect} then 1 else 0 end)::int`,
    })
    .from(sessionAnswer)
    .innerJoin(practiceSession, eq(sessionAnswer.sessionId, practiceSession.id))
    .innerJoin(subject, eq(practiceSession.subjectId, subject.id))
    .where(eq(practiceSession.userId, userId))
    .groupBy(
      practiceSession.subjectId,
      subject.name,
      subject.slug,
      subject.iconName
    )

  return rows.map((r) => ({
    subjectId: r.subjectId,
    subjectName: r.subjectName,
    subjectSlug: r.subjectSlug,
    subjectIcon: r.subjectIcon,
    total: Number(r.total),
    correct: Number(r.correct ?? 0),
    accuracy: Number(r.total) > 0
      ? Math.round((Number(r.correct ?? 0) / Number(r.total)) * 100)
      : 0,
  }))
}

/** Recent activity — last N answered questions */
export async function getRecentActivity(userId: string, limit = 5) {
  return db
    .select({
      answeredAt: sessionAnswer.answeredAt,
      isCorrect: sessionAnswer.isCorrect,
      questionBody: question.body,
      subjectName: subject.name,
      examLabel: exam.label,
    })
    .from(sessionAnswer)
    .innerJoin(practiceSession, eq(sessionAnswer.sessionId, practiceSession.id))
    .innerJoin(question, eq(sessionAnswer.questionId, question.id))
    .innerJoin(subject, eq(practiceSession.subjectId, subject.id))
    .innerJoin(exam, eq(practiceSession.examId, exam.id))
    .where(eq(practiceSession.userId, userId))
    .orderBy(desc(sessionAnswer.answeredAt))
    .limit(limit)
}

/** Streak — consecutive days with at least one answer */
export async function getUserStreak(userId: string): Promise<number> {
  const rows = await db
    .selectDistinct({
      day: sql<string>`date_trunc('day', ${sessionAnswer.answeredAt})::date::text`,
    })
    .from(sessionAnswer)
    .innerJoin(practiceSession, eq(sessionAnswer.sessionId, practiceSession.id))
    .where(eq(practiceSession.userId, userId))
    .orderBy(sql`1 desc`)

  if (rows.length === 0) return 0

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  let streak = 0
  let cursor = today

  for (const row of rows) {
    const day = new Date(row.day)
    day.setUTCHours(0, 0, 0, 0)
    const diff = Math.round((cursor.getTime() - day.getTime()) / 86400000)
    if (diff > 1) break
    streak++
    cursor = day
  }

  return streak
}

/** Full results for a completed practice session */
export async function getSessionResults(sessionId: number, userId: string) {
  const [sess] = await db
    .select()
    .from(practiceSession)
    .where(and(eq(practiceSession.id, sessionId), eq(practiceSession.userId, userId)))
    .limit(1)

  if (!sess) return null

  const answers = await db
    .select({
      answerId: sessionAnswer.id,
      isCorrect: sessionAnswer.isCorrect,
      selectedOptionId: sessionAnswer.selectedOptionId,
      timeSpentMs: sessionAnswer.timeSpentMs,
      questionId: question.id,
      questionBody: question.body,
      explanation: question.explanation,
      orderIndex: question.orderIndex,
    })
    .from(sessionAnswer)
    .innerJoin(question, eq(sessionAnswer.questionId, question.id))
    .where(eq(sessionAnswer.sessionId, sessionId))
    .orderBy(question.orderIndex)

  const questionIds = [...new Set(answers.map((a) => a.questionId))]
  const allOptions =
    questionIds.length > 0
      ? await db
          .select()
          .from(option)
          .where(inArray(option.questionId, questionIds))
      : []

  const optionsByQuestion = new Map<number, typeof allOptions>()
  for (const opt of allOptions) {
    const arr = optionsByQuestion.get(opt.questionId) ?? []
    arr.push(opt)
    optionsByQuestion.set(opt.questionId, arr)
  }

  const enriched = answers.map((a) => ({
    ...a,
    options: (optionsByQuestion.get(a.questionId) ?? []).sort((x, y) =>
      x.label.localeCompare(y.label)
    ),
  }))

  return { session: sess, answers: enriched }
}

/** Accuracy over time — daily accuracy buckets for the given number of days */
export async function getAccuracyOverTime(
  userId: string,
  days: 7 | 30 | 90 = 30
): Promise<Array<{ date: string; accuracy: number; total: number }>> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setUTCHours(0, 0, 0, 0)

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${sessionAnswer.answeredAt})::date::text`,
      total: count(sessionAnswer.id),
      correct: sql<number>`sum(case when ${sessionAnswer.isCorrect} then 1 else 0 end)::int`,
    })
    .from(sessionAnswer)
    .innerJoin(practiceSession, eq(sessionAnswer.sessionId, practiceSession.id))
    .where(
      and(
        eq(practiceSession.userId, userId),
        gte(sessionAnswer.answeredAt, since)
      )
    )
    .groupBy(sql`date_trunc('day', ${sessionAnswer.answeredAt})::date`)
    .orderBy(sql`date_trunc('day', ${sessionAnswer.answeredAt})::date`)

  return rows.map((r) => ({
    date: r.date,
    total: Number(r.total),
    accuracy: Number(r.total) > 0
      ? Math.round((Number(r.correct ?? 0) / Number(r.total)) * 100)
      : 0,
  }))
}

/** Per-topic stats for weak area detection */
export async function getUserTopicStats(userId: string) {
  const rows = await db
    .select({
      topicId: question.topicId,
      topicName: topic.name,
      subjectName: subject.name,
      total: count(sessionAnswer.id),
      correct: sql<number>`sum(case when ${sessionAnswer.isCorrect} then 1 else 0 end)::int`,
    })
    .from(sessionAnswer)
    .innerJoin(practiceSession, eq(sessionAnswer.sessionId, practiceSession.id))
    .innerJoin(question, eq(sessionAnswer.questionId, question.id))
    .innerJoin(subject, eq(question.subjectId, subject.id))
    .leftJoin(topic, eq(question.topicId, topic.id))
    .where(eq(practiceSession.userId, userId))
    .groupBy(question.topicId, topic.name, subject.name)

  return rows
    .filter((r) => r.topicId !== null && r.topicName !== null && Number(r.total) >= 3)
    .map((r) => ({
      topicId: r.topicId!,
      topicName: r.topicName!,
      subjectName: r.subjectName,
      total: Number(r.total),
      correct: Number(r.correct ?? 0),
      accuracy: Math.round((Number(r.correct ?? 0) / Number(r.total)) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
}

/** All subject stats including subjects with zero attempts (for "not started" display) */
export async function getAllSubjectPerformance(userId: string) {
  // Get subjects that have data loaded in the DB
  const allSubjects = await db
    .selectDistinct({
      id: subject.id,
      name: subject.name,
      slug: subject.slug,
      iconName: subject.iconName,
    })
    .from(subject)
    .innerJoin(question, eq(question.subjectId, subject.id))
    .orderBy(subject.sortOrder)

  // Get per-subject attempted stats
  const attempted = await db
    .select({
      subjectId: practiceSession.subjectId,
      total: count(sessionAnswer.id),
      correct: sql<number>`sum(case when ${sessionAnswer.isCorrect} then 1 else 0 end)::int`,
    })
    .from(sessionAnswer)
    .innerJoin(practiceSession, eq(sessionAnswer.sessionId, practiceSession.id))
    .where(eq(practiceSession.userId, userId))
    .groupBy(practiceSession.subjectId)

  const attemptMap = new Map(
    attempted.map((r) => [r.subjectId, { total: Number(r.total), correct: Number(r.correct ?? 0) }])
  )

  return allSubjects.map((s) => {
    const data = attemptMap.get(s.id)
    return {
      subjectId: s.id,
      subjectName: s.name,
      subjectSlug: s.slug,
      subjectIcon: s.iconName,
      total: data?.total ?? 0,
      correct: data?.correct ?? 0,
      accuracy: data && data.total > 0
        ? Math.round((data.correct / data.total) * 100)
        : null, // null = not started
    }
  })
}
