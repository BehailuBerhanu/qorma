import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import {
  getChallengeWithQuestions,
  getChallengeAttempt,
  getChallengeAnswers,
  getGroupById,
  getChallengeLeaderboard,
} from '@/lib/db/queries/study-groups'
import ChallengeSession from '@/components/study-groups/challenge-session'
import ChallengeResults from '@/components/study-groups/challenge-results'

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ groupId: string; challengeId: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const { groupId, challengeId } = await params
  const gid = parseInt(groupId, 10)
  const cid = parseInt(challengeId, 10)
  if (isNaN(gid) || isNaN(cid)) notFound()

  // Verify membership
  const group = await getGroupById(gid, session.user.id).catch(() => null)
  if (!group || !group.membership) redirect(`/study-groups/${gid}`)

  const data = await getChallengeWithQuestions(cid).catch(() => null)
  if (!data) notFound()

  const attempt = await getChallengeAttempt(cid, session.user.id).catch(() => null)

  // If already completed, show results
  if (attempt?.completedAt) {
    const answers = await getChallengeAnswers(attempt.id).catch(() => [])
    const leaderboard = await getChallengeLeaderboard(cid).catch(() => [])
    return (
      <ChallengeResults
        challenge={data.challenge}
        questions={data.questions}
        attempt={attempt}
        answers={answers}
        leaderboard={leaderboard}
        groupId={gid}
        groupName={group.name}
      />
    )
  }

  return (
    <ChallengeSession
      challenge={data.challenge}
      questions={data.questions}
      existingAttemptId={attempt?.id ?? null}
      groupId={gid}
      groupName={group.name}
    />
  )
}
