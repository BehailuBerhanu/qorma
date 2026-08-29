import { db } from '@/lib/db'
import { practiceSession, sessionAnswer, question, subject, exam, option } from '@/lib/db/schema'
import { eq, and, desc, sql, count, inArray } from 'drizzle-orm'

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
