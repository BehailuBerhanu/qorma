import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  getUserStats,
  getAllSubjectPerformance,
  getUserTopicStats,
  getAccuracyOverTime,
} from '@/lib/db/queries/progress'
import PerformanceView from '@/components/performance/performance-view'

export const metadata = { title: 'Performance — Qorma' }

export default async function PerformancePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const uid = session.user.id

  const [stats, subjectPerf, topicStats, chartData7, chartData30, chartData90] =
    await Promise.all([
      getUserStats(uid).catch(() => ({ totalAnswered: 0, totalCorrect: 0, accuracy: 0 })),
      getAllSubjectPerformance(uid).catch(() => []),
      getUserTopicStats(uid).catch(() => []),
      getAccuracyOverTime(uid, 7).catch(() => []),
      getAccuracyOverTime(uid, 30).catch(() => []),
      getAccuracyOverTime(uid, 90).catch(() => []),
    ])

  return (
    <PerformanceView
      stats={stats}
      subjectPerf={subjectPerf}
      topicStats={topicStats}
      chartData7={chartData7}
      chartData30={chartData30}
      chartData90={chartData90}
    />
  )
}
