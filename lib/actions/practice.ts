'use server'

import { db } from '@/lib/db'
import { practiceSession, sessionAnswer, option, question } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/** Create a new practice session and return its id */
export async function createPracticeSession(
  examId: number,
  subjectId: number
): Promise<{ sessionId: number }> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  // Count available questions for this exam + subject
  const [countRow] = await db
    .select({ total: count() })
    .from(question)
    .where(and(eq(question.examId, examId), eq(question.subjectId, subjectId)))

  const totalQuestions = Number(countRow?.total ?? 0)

  const [created] = await db
    .insert(practiceSession)
    .values({
      userId: session.user.id,
      examId,
      subjectId,
      totalQuestions,
    })
    .returning({ id: practiceSession.id })

  return { sessionId: created.id }
}

export type SubmitAnswerResult = {
  isCorrect: boolean
  correctOptionId: number
  explanation: string | null
}

/** Submit an answer for one question in a session */
export async function submitAnswer(
  sessionId: number,
  questionId: number,
  selectedOptionId: number,
  timeSpentMs: number
): Promise<SubmitAnswerResult> {
  const authSession = await auth.api.getSession({ headers: await headers() })
  if (!authSession?.user) redirect('/sign-in')

  // Verify session belongs to user
  const [sess] = await db
    .select()
    .from(practiceSession)
    .where(
      and(
        eq(practiceSession.id, sessionId),
        eq(practiceSession.userId, authSession.user.id)
      )
    )
    .limit(1)

  if (!sess) throw new Error('Session not found')

  // Check if already answered (prevent double-submission)
  const [existing] = await db
    .select()
    .from(sessionAnswer)
    .where(
      and(
        eq(sessionAnswer.sessionId, sessionId),
        eq(sessionAnswer.questionId, questionId)
      )
    )
    .limit(1)

  // Fetch correct option regardless
  const [correctOpt] = await db
    .select({ id: option.id })
    .from(option)
    .where(and(eq(option.questionId, questionId), eq(option.isCorrect, true)))
    .limit(1)

  // Fetch explanation
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

  // Determine correctness
  const [selected] = await db
    .select({ isCorrect: option.isCorrect })
    .from(option)
    .where(eq(option.id, selectedOptionId))
    .limit(1)

  const isCorrect = selected?.isCorrect ?? false

  // Insert the answer record
  await db.insert(sessionAnswer).values({
    sessionId,
    questionId,
    selectedOptionId,
    isCorrect,
    timeSpentMs,
  })

  // Increment correct count on session if correct
  if (isCorrect) {
    await db
      .update(practiceSession)
      .set({ correctCount: sess.correctCount + 1 })
      .where(eq(practiceSession.id, sessionId))
  }

  return {
    isCorrect,
    correctOptionId: correctOpt?.id ?? selectedOptionId,
    explanation: q?.explanation ?? null,
  }
}

/** Mark a session as completed */
export async function completePracticeSession(sessionId: number): Promise<void> {
  const authSession = await auth.api.getSession({ headers: await headers() })
  if (!authSession?.user) redirect('/sign-in')

  await db
    .update(practiceSession)
    .set({ completedAt: new Date() })
    .where(
      and(
        eq(practiceSession.id, sessionId),
        eq(practiceSession.userId, authSession.user.id)
      )
    )
}
