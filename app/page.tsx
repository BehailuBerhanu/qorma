import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import QormaDashboard from '@/components/qorma-dashboard'
import { getUserStats, getUserSubjectStats, getRecentActivity, getUserStreak, getAccuracyOverTime } from '@/lib/db/queries/progress'
import { getSubjectsWithData } from '@/lib/db/queries/exams'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/landing')

  // Fetch real data in parallel — fallback gracefully if DB is empty
  const [stats, subjectStats, recentActivity, streak, allSubjects, chartData] = await Promise.all([
    getUserStats(session.user.id).catch(() => ({ totalAnswered: 0, totalCorrect: 0, accuracy: 0 })),
    getUserSubjectStats(session.user.id).catch(() => []),
    getRecentActivity(session.user.id, 5).catch(() => []),
    getUserStreak(session.user.id).catch(() => 0),
    getSubjectsWithData().catch(() => []),
    getAccuracyOverTime(session.user.id, 30).catch(() => []),
  ])

  return (
    <QormaDashboard
      user={session.user}
      stats={stats}
      subjectStats={subjectStats}
      recentActivity={recentActivity}
      streak={streak}
      allSubjects={allSubjects}
      chartData={chartData}
    />
  )
}
