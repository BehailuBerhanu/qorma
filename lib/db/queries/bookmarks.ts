import { db } from '@/lib/db'
import { bookmark, question, exam, subject, topic } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export type BookmarkedQuestion = {
  bookmarkId: number
  bookmarkedAt: Date
  questionId: number
  questionBody: string
  orderIndex: number
  difficulty: string | null
  examLabel: string
  examYear: number
  subjectName: string
  topicName: string | null
}

/** All bookmarked questions for a user, newest first */
export async function getBookmarkedQuestions(userId: string): Promise<BookmarkedQuestion[]> {
  const rows = await db
    .select({
      bookmarkId: bookmark.id,
      bookmarkedAt: bookmark.createdAt,
      questionId: question.id,
      questionBody: question.body,
      orderIndex: question.orderIndex,
      difficulty: question.difficulty,
      examLabel: exam.label,
      examYear: exam.year,
      subjectName: subject.name,
      topicName: topic.name,
    })
    .from(bookmark)
    .innerJoin(question, eq(bookmark.questionId, question.id))
    .innerJoin(exam, eq(question.examId, exam.id))
    .innerJoin(subject, eq(question.subjectId, subject.id))
    .leftJoin(topic, eq(question.topicId, topic.id))
    .where(eq(bookmark.userId, userId))
    .orderBy(desc(bookmark.createdAt))

  return rows.map((r) => ({
    ...r,
    bookmarkedAt: r.bookmarkedAt,
    topicName: r.topicName ?? null,
  }))
}

/** Check if a specific question is bookmarked by the user */
export async function isQuestionBookmarked(userId: string, questionId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: bookmark.id })
    .from(bookmark)
    .where(and(eq(bookmark.userId, userId), eq(bookmark.questionId, questionId)))
    .limit(1)
  return !!row
}

/** Get bookmark ids for a list of question ids (for bulk status check in a session) */
export async function getBookmarkStatusForQuestions(
  userId: string,
  questionIds: number[]
): Promise<Set<number>> {
  if (questionIds.length === 0) return new Set()
  const { inArray } = await import('drizzle-orm')
  const rows = await db
    .select({ questionId: bookmark.questionId })
    .from(bookmark)
    .where(and(eq(bookmark.userId, userId), inArray(bookmark.questionId, questionIds)))
  return new Set(rows.map((r) => r.questionId))
}
