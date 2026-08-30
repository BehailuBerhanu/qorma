import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import {
  getGroupById,
  getGroupStats,
  getGroupPosts,
  getGroupMembers,
  getGroupChallenges,
  getActiveChallenge,
  getGroupLeaderboard,
} from '@/lib/db/queries/study-groups'
import GroupHome from '@/components/study-groups/group-home'

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const { groupId } = await params
  const id = parseInt(groupId, 10)
  if (isNaN(id)) notFound()

  const group = await getGroupById(id, session.user.id).catch(() => null)
  if (!group) notFound()

  const [stats, posts, members, challenges, activeChallenge, leaderboard] = await Promise.all([
    getGroupStats(id).catch(() => ({ totalAnswered: 0, avgAccuracy: 0, activeMembers: 0, memberCount: 0 })),
    getGroupPosts(id).catch(() => []),
    getGroupMembers(id).catch(() => []),
    getGroupChallenges(id).catch(() => []),
    getActiveChallenge(id).catch(() => null),
    getGroupLeaderboard(id).catch(() => []),
  ])

  return (
    <GroupHome
      group={group}
      currentUser={{ id: session.user.id, name: session.user.name }}
      stats={stats}
      posts={posts}
      members={members}
      challenges={challenges}
      activeChallenge={activeChallenge}
      leaderboard={leaderboard}
    />
  )
}
