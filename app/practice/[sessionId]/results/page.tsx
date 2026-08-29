import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getSessionResults } from '@/lib/db/queries/progress'
import { db } from '@/lib/db'
import { exam, subject } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import SessionResults from '@/components/practice/session-results'

export const metadata = { title: 'Practice Results — Qorma' }

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const { sessionId } = await params
  const id = parseInt(sessionId, 10)
  if (isNaN(id)) notFound()

  const results = await getSessionResults(id, session.user.id)
  if (!results) notFound()

  // Fetch exam + subject labels for the header
  const [[examRow], [subjectRow]] = await Promise.all([
    db.select({ label: exam.label }).from(exam).where(eq(exam.id, results.session.examId)).limit(1),
    db.select({ name: subject.name }).from(subject).where(eq(subject.id, results.session.subjectId)).limit(1),
  ])

  return (
    <SessionResults
      results={results}
      examLabel={examRow?.label ?? 'EUEE'}
      subjectName={subjectRow?.name ?? 'Practice'}
    />
  )
}
