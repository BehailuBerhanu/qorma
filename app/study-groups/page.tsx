import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyGroups, getDiscoverGroups } from '@/lib/db/queries/study-groups'
import StudyGroupsHome from '@/components/study-groups/study-groups-home'

export const metadata = { title: 'Study Groups — Qorma' }

export default async function StudyGroupsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const [myGroups, discoverGroups] = await Promise.all([
    getMyGroups(session.user.id).catch(() => []),
    getDiscoverGroups(session.user.id).catch(() => []),
  ])

  return (
    <StudyGroupsHome
      user={{ id: session.user.id, name: session.user.name }}
      myGroups={myGroups}
      discoverGroups={discoverGroups}
    />
  )
}
