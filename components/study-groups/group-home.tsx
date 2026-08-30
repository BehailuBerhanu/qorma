'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, BookOpen, ChevronDown, Clock, Copy, Crown,
  FlameIcon, Globe, Lock, MessageSquare, Pin, Plus,
  Shield, Target, Trophy, Users, Zap,
} from 'lucide-react'
import GroupDiscussion from './group-discussion'
import GroupMembers from './group-members'
import GroupLeaderboard from './group-leaderboard'
import GroupChallenges from './group-challenges'
import GroupSettings from './group-settings'

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = 'owner' | 'admin' | 'member'

interface Group {
  id: number
  name: string
  description: string | null
  privacy: string
  examId: number | null
  examLabel: string | null
  examType: string | null
  ownerId: string
  goal: string | null
  inviteToken: string | null
  memberCount: number
  subjects: Array<{ id: number; name: string; slug: string; iconName: string }>
  membership: { role: Role } | null
}

interface Stats {
  totalAnswered: number
  avgAccuracy: number
  activeMembers: number
  memberCount: number
}

interface Post {
  id: number
  content: string
  isPinned: boolean
  createdAt: Date
  userId: string
  userName: string
  questionId: number | null
  attachedQuestion: {
    questionId: number
    body: string
    orderIndex: number
    examLabel: string
    subjectName: string
  } | null
  comments: Array<{
    id: number
    content: string
    createdAt: Date
    userId: string
    userName: string
    postId: number
  }>
}

interface Member {
  userId: string
  name: string
  email: string
  role: string
  joinedAt: Date
  totalAnswered: number
  accuracy: number
}

interface Challenge {
  id: number
  title: string
  questionCount: number
  timeLimitMins: number
  startAt: Date
  endAt: Date
  subjectName: string | null
}

interface ActiveChallenge {
  id: number
  title: string
  description: string | null
  questionCount: number
  timeLimitMins: number
  startAt: Date
  endAt: Date
  subjectName: string | null
  examLabel: string | null
  participantCount: number
}

interface LeaderboardEntry {
  userId: string
  name: string
  totalAnswered: number
  accuracy: number
  challengeScore: number
  challengeCount: number
}

interface Props {
  group: Group
  currentUser: { id: string; name: string }
  stats: Stats
  posts: Post[]
  members: Member[]
  challenges: Challenge[]
  activeChallenge: ActiveChallenge | null
  leaderboard: LeaderboardEntry[]
}

type Tab = 'discussion' | 'challenges' | 'members' | 'leaderboard' | 'settings'

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ icon: Icon, value, label }: { icon: typeof Zap; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-emerald-900/40 px-4 py-3 text-center">
      <Icon size={16} className="mb-1 text-emerald-300" />
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-emerald-200/70">{label}</div>
    </div>
  )
}

// ─── Active challenge banner ──────────────────────────────────────────────────

function ChallengeBanner({
  challenge,
  groupId,
  canCreate,
  onCreateClick,
}: {
  challenge: ActiveChallenge | null
  groupId: number
  canCreate: boolean
  onCreateClick: () => void
}) {
  if (!challenge) {
    return (
      <div className="dashboard-card mb-5 flex items-center justify-between gap-4 p-5">
        <div>
          <div className="flex items-center gap-2 text-slate-500">
            <FlameIcon size={16} />
            <span className="text-sm font-medium">No active challenge</span>
          </div>
          {canCreate && (
            <p className="mt-0.5 text-xs text-slate-400">
              Create a challenge to energize your group.
            </p>
          )}
        </div>
        {canCreate && (
          <button
            onClick={onCreateClick}
            className="shrink-0 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Create Challenge
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mb-5 overflow-hidden rounded-2xl bg-[#03251d] p-5 text-white">
      <div className="mb-3 flex items-center gap-2">
        <FlameIcon size={16} className="text-orange-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-orange-400">
          Today's Challenge
        </span>
      </div>
      <h3 className="text-lg font-semibold">{challenge.title}</h3>
      <div className="mt-2 flex flex-wrap gap-3 text-sm text-emerald-100/80">
        {challenge.subjectName && <span>{challenge.subjectName}</span>}
        <span className="flex items-center gap-1">
          <BookOpen size={13} />
          {challenge.questionCount} questions
        </span>
        <span className="flex items-center gap-1">
          <Clock size={13} />
          {challenge.timeLimitMins} minutes
        </span>
        <span className="flex items-center gap-1">
          <Users size={13} />
          {challenge.participantCount} participating
        </span>
      </div>
      <div className="mt-4">
        <Link
          href={`/study-groups/${groupId}/challenge/${challenge.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
        >
          Start Challenge
        </Link>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GroupHome({
  group, currentUser, stats, posts, members, challenges, activeChallenge, leaderboard,
}: Props) {
  const [tab, setTab] = useState<Tab>('discussion')
  const [copied, setCopied] = useState(false)

  const myRole = group.membership?.role as Role | undefined
  const isAdminOrOwner = myRole === 'owner' || myRole === 'admin'
  const isMember = !!myRole

  const inviteUrl =
    group.inviteToken
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/study-groups/join/${group.inviteToken}`
      : null

  function copyInvite() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof MessageSquare }> = [
    { id: 'discussion', label: 'Discussion', icon: MessageSquare },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Crown },
    ...(isAdminOrOwner ? [{ id: 'settings' as Tab, label: 'Settings', icon: Shield }] : []),
  ]

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      {/* ── Group header ── */}
      <div className="bg-[#03251d] px-5 pb-0 pt-6 text-white lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/study-groups"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-emerald-300 transition hover:text-white"
          >
            <ArrowLeft size={14} />
            Study Groups
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs text-emerald-300">
                {group.privacy === 'private' ? (
                  <><Lock size={11} /> Private</>
                ) : (
                  <><Globe size={11} /> Public</>
                )}
                {group.examLabel && (
                  <><span>·</span><span>{group.examLabel}</span></>
                )}
                {myRole && (
                  <><span>·</span>
                  <span className="capitalize font-semibold">{myRole}</span></>
                )}
              </div>
              <h1 className="text-2xl font-semibold leading-tight">{group.name}</h1>
              {group.subjects.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {group.subjects.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full bg-emerald-800/60 px-2.5 py-0.5 text-xs text-emerald-200"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Invite button */}
            {inviteUrl && isAdminOrOwner && (
              <button
                onClick={copyInvite}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-800"
              >
                <Copy size={13} />
                {copied ? 'Copied!' : 'Copy Invite Link'}
              </button>
            )}
          </div>

          {/* Group stats */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatPill icon={Target} value={stats.totalAnswered.toLocaleString()} label="Questions Solved" />
            <StatPill icon={Zap} value={`${stats.avgAccuracy}%`} label="Avg Accuracy" />
            <StatPill icon={Users} value={stats.activeMembers} label="Active Members" />
            <StatPill icon={Users} value={stats.memberCount} label="Total Members" />
          </div>

          {/* Tabs */}
          <div className="mt-5 flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
                  tab === t.id
                    ? 'bg-[#f8faf9] text-emerald-800'
                    : 'text-emerald-200/80 hover:bg-emerald-800/40'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="mx-auto max-w-4xl px-5 py-6 lg:px-8">

        {/* Active challenge — always visible on discussion tab */}
        {tab === 'discussion' && (
          <ChallengeBanner
            challenge={activeChallenge}
            groupId={group.id}
            canCreate={isAdminOrOwner}
            onCreateClick={() => setTab('challenges')}
          />
        )}

        {tab === 'discussion' && (
          <GroupDiscussion
            groupId={group.id}
            currentUserId={currentUser.id}
            posts={posts}
            isMember={isMember}
            isAdminOrOwner={isAdminOrOwner}
          />
        )}

        {tab === 'challenges' && (
          <GroupChallenges
            groupId={group.id}
            groupExamId={group.examId}
            challenges={challenges}
            activeChallenge={activeChallenge}
            isAdminOrOwner={isAdminOrOwner}
          />
        )}

        {tab === 'members' && (
          <GroupMembers
            groupId={group.id}
            currentUserId={currentUser.id}
            members={members}
            currentUserRole={myRole ?? 'member'}
          />
        )}

        {tab === 'leaderboard' && (
          <GroupLeaderboard
            leaderboard={leaderboard}
            currentUserId={currentUser.id}
          />
        )}

        {tab === 'settings' && isAdminOrOwner && (
          <GroupSettings
            group={group}
            currentUserRole={myRole ?? 'member'}
          />
        )}
      </main>
    </div>
  )
}
