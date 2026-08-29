import { db } from '@/lib/db'
import { exam, subject, question, option } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'

/** All exams, optionally filtered by subject slug */
export async function getExams(subjectSlug?: string) {
  if (!subjectSlug) {
    return db.select().from(exam).orderBy(exam.year)
  }

  // Return only exams that have at least one question for the given subject
  const sub = await db
    .select()
    .from(subject)
    .where(eq(subject.slug, subjectSlug))
    .limit(1)

  if (!sub[0]) return []

  const rows = await db
    .selectDistinct({ exam })
    .from(exam)
    .innerJoin(question, and(eq(question.examId, exam.id), eq(question.subjectId, sub[0].id)))
    .orderBy(exam.year)

  return rows.map((r) => r.exam)
}

/** Single exam by id */
export async function getExamById(id: number) {
  const rows = await db.select().from(exam).where(eq(exam.id, id)).limit(1)
  return rows[0] ?? null
}

/** All subjects */
export async function getSubjects() {
  return db.select().from(subject).orderBy(subject.sortOrder)
}

/** Single subject by slug */
export async function getSubjectBySlug(slug: string) {
  const rows = await db
    .select()
    .from(subject)
    .where(eq(subject.slug, slug))
    .limit(1)
  return rows[0] ?? null
}

/** Question count per subject for a given exam */
export async function getQuestionCountBySubject(examId: number) {
  const rows = await db
    .select({ subjectId: question.subjectId, count: count() })
    .from(question)
    .where(eq(question.examId, examId))
    .groupBy(question.subjectId)
  return rows
}
