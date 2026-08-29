import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getExamById, getSubjects, getQuestionCountBySubject } from '@/lib/db/queries/exams'
import ExamDetail from '@/components/exams/exam-detail'

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const { examId } = await params
  const id = parseInt(examId, 10)
  if (isNaN(id)) notFound()

  const [exam, subjects, counts] = await Promise.all([
    getExamById(id),
    getSubjects(),
    getQuestionCountBySubject(id),
  ])

  if (!exam) notFound()

  // Build a map of subjectId → question count
  const countMap = new Map(counts.map((c) => [c.subjectId, Number(c.count)]))

  // Only show subjects that have questions for this exam
  const availableSubjects = subjects
    .filter((s) => (countMap.get(s.id) ?? 0) > 0)
    .map((s) => ({ ...s, questionCount: countMap.get(s.id) ?? 0 }))

  return <ExamDetail exam={exam} subjects={availableSubjects} />
}
