import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { practiceSession, exam, subject } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getQuestionsForSession } from '@/lib/db/queries/questions'
import PracticeSession from '@/components/practice/practice-session'

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const { sessionId } = await params
  const id = parseInt(sessionId, 10)
  if (isNaN(id)) notFound()

  // Verify ownership
  const [sess] = await db
    .select()
    .from(practiceSession)
    .where(
      and(
        eq(practiceSession.id, id),
        eq(practiceSession.userId, session.user.id)
      )
    )
    .limit(1)

  if (!sess) notFound()

  if (sess.completedAt) {
    redirect(`/practice/${id}/results`)
  }

  // Fetch exam and subject labels for the header
  const [[examRow], [subjectRow], questions] = await Promise.all([
    db.select({ label: exam.label }).from(exam).where(eq(exam.id, sess.examId)).limit(1),
    db.select({ name: subject.name }).from(subject).where(eq(subject.id, sess.subjectId)).limit(1),
    getQuestionsForSession(sess.examId, sess.subjectId),
  ])

  if (questions.length === 0) {
    redirect(`/exams/${sess.examId}`)
  }

  return (
    <PracticeSession
      sessionId={id}
      examId={sess.examId}
      subjectId={sess.subjectId}
      examLabel={examRow?.label ?? 'EUEE'}
      subjectName={subjectRow?.name ?? 'Practice'}
      questions={questions}
    />
  )
}
