import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getExams, getSubjects } from '@/lib/db/queries/exams'
import ExamBrowser from '@/components/exams/exam-browser'

export const metadata = { title: 'Past Exams — Qorma' }

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const { subject } = await searchParams

  const [exams, subjects] = await Promise.all([
    getExams(subject),
    getSubjects(),
  ])

  return (
    <ExamBrowser
      exams={exams}
      subjects={subjects}
      activeSubjectSlug={subject ?? null}
    />
  )
}
