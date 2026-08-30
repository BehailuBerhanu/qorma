import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSubjects } from '@/lib/db/queries/exams'
import { db } from '@/lib/db'
import { exam } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import CreateGroupForm from '@/components/study-groups/create-group-form'

export const metadata = { title: 'Create Study Group — Qorma' }

export default async function CreateGroupPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const [subjects, exams] = await Promise.all([
    getSubjects(),
    db.select().from(exam).orderBy(asc(exam.year)),
  ])

  return <CreateGroupForm subjects={subjects} exams={exams} />
}
