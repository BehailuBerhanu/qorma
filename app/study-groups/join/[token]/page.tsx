import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getGroupByInviteToken } from '@/lib/db/queries/study-groups'
import JoinGroupView from '@/components/study-groups/join-group-view'

export default async function JoinGroupPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const { token } = await params
  const group = await getGroupByInviteToken(token).catch(() => null)
  if (!group) notFound()

  return <JoinGroupView token={token} group={group} />
}
