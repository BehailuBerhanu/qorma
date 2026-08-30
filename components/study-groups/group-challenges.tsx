'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Clock, FlameIcon, Plus } from 'lucide-react'
import { createChallenge } from '@/lib/actions/study-groups'

interface Challenge {
  id: number
  title: string
  questionCount: number
  timeLimitMins: number
  startAt: Date
  endAt: Date
  subjectName: string | null
}

interface ActiveChallenge extends Challenge {
  participantCount: number
  description: string | null
  examLabel: string | null
}

interface Props {
  groupId: number
  groupExamId: number | null
  challenges: Challenge[]
  activeChallenge: ActiveChallenge | null
  isAdminOrOwner: boolean
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function ChallengeStatus({ startAt, endAt }: { startAt: Date; endAt: Date }) {
  const now = Date.now()
  const start = new Date(startAt).getTime()
  const end = new Date(endAt).getTime()
  if (now < start) return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Upcoming</span>
  if (now > end) return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Ended</span>
  return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Active</span>
}

function CreateChallengeForm({
  groupId,
  groupExamId,
  onDone,
}: {
  groupId: number
  groupExamId: number | null
  onDone: () => void
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [title, setTitle] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [timeLimitMins, setTimeLimitMins] = useState(15)
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !startAt || !endAt) { setError('All fields required'); return }
    setError('')
    setPending(true)
    try {
      await createChallenge(groupId, {
        title,
        questionCount,
        timeLimitMins,
        examId: groupExamId ?? undefined,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
      })
      onDone()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create challenge')
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="dashboard-card mb-5 space-y-4 p-5">
      <h3 className="font-semibold text-slate-800">New Challenge</h3>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. EUEE Physics — Mechanics"
          className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Questions</label>
          <input
            type="number" min={3} max={50}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Time (minutes)</label>
          <input
            type="number" min={5} max={120}
            value={timeLimitMins}
            onChange={(e) => setTimeLimitMins(Number(e.target.value))}
            className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Starts at</label>
          <input
            type="datetime-local" value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Ends at</label>
          <input
            type="datetime-local" value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit" disabled={pending}
          className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? 'Creating…' : 'Create Challenge'}
        </button>
        <button type="button" onClick={onDone} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function GroupChallenges({
  groupId, groupExamId, challenges, activeChallenge, isAdminOrOwner,
}: Props) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title">Challenges</h2>
        {isAdminOrOwner && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            <Plus size={13} />
            Create Challenge
          </button>
        )}
      </div>

      {showCreate && (
        <CreateChallengeForm
          groupId={groupId}
          groupExamId={groupExamId}
          onDone={() => setShowCreate(false)}
        />
      )}

      {challenges.length === 0 && !showCreate ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center">
          <FlameIcon size={28} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No active challenge</p>
          <p className="mt-1 text-xs text-slate-500">
            {isAdminOrOwner
              ? 'Create a challenge to test your group.'
              : 'Admins can create challenges for the group.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => {
            const isActive =
              Date.now() >= new Date(c.startAt).getTime() &&
              Date.now() <= new Date(c.endAt).getTime()
            return (
              <div key={c.id} className="dashboard-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{c.title}</h3>
                      <ChallengeStatus startAt={c.startAt} endAt={c.endAt} />
                    </div>
                    {c.subjectName && (
                      <div className="mt-0.5 text-xs text-emerald-700">{c.subjectName}</div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><BookOpen size={11} />{c.questionCount} questions</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{c.timeLimitMins} min</span>
                      <span>{formatDate(c.startAt)} → {formatDate(c.endAt)}</span>
                    </div>
                  </div>
                  {isActive && (
                    <Link
                      href={`/study-groups/${groupId}/challenge/${c.id}`}
                      className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Start
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
