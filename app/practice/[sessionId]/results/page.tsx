import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getSessionResults } from '@/lib/db/queries/progress'
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

  return <SessionResults results={results} />
}
