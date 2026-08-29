import { db } from '@/lib/db'
import { question, option } from '@/lib/db/schema'
import { eq, and, asc, inArray } from 'drizzle-orm'

/** All questions for a given exam + subject, ordered by orderIndex, with options */
export async function getQuestionsForSession(examId: number, subjectId: number) {
  const questions = await db
    .select()
    .from(question)
    .where(and(eq(question.examId, examId), eq(question.subjectId, subjectId)))
    .orderBy(asc(question.orderIndex))

  if (questions.length === 0) return []

  const questionIds = questions.map((q) => q.id)

  const allOptions = await db
    .select()
    .from(option)
    .where(inArray(option.questionId, questionIds))

  // Group options by questionId
  const optionsByQuestion = new Map<number, typeof allOptions>()
  for (const opt of allOptions) {
    const existing = optionsByQuestion.get(opt.questionId) ?? []
    existing.push(opt)
    optionsByQuestion.set(opt.questionId, existing)
  }

  return questions.map((q) => ({
    ...q,
    options: (optionsByQuestion.get(q.id) ?? []).sort((a, b) =>
      a.label.localeCompare(b.label)
    ),
  }))
}

/** Single question with its options */
export async function getQuestionWithOptions(questionId: number) {
  const rows = await db
    .select()
    .from(question)
    .where(eq(question.id, questionId))
    .limit(1)

  if (!rows[0]) return null

  const options = await db
    .select()
    .from(option)
    .where(eq(option.questionId, questionId))
    .orderBy(asc(option.label))

  return { ...rows[0], options }
}
