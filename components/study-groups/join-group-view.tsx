'use client'

import { useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, BookOpen } from 'lucide-react'
import { joinGroupByToken } from '@/lib/actions/study-groups'

interface Props {
  token: string
  group: {
    id: number
    name: string
    description: string | null
    privacy: string
    examLabel: string | null
    memberCount: number
  }
}

export default function JoinGroupView({ token, group }: Props) {
  const router = useRouter()
  const [joining, startJoin] = useTransition()
  const resultRef = useRef<number | null>(null)

  function handleJoin() {
    startJoin(async () => {
      const { groupId } = await joinGroupByToken(token)
      resultRef.current = groupId
    })
  }

  useEffect(() => {
    if (!joining && resultRef.current !== null) {
      router.push(`/study-groups/${resultRef.current}`)
      resultRef.current = null
    }
  }, [joining, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8faf9] px-5">
      <div className="dashboard-card w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
          <Users size={26} className="text-emerald-600" />
        </div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-600">
          You're invited
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">{group.name}</h1>
        {group.examLabel && (
          <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-500">
            <BookOpen size={13} />
            {group.examLabel}
          </div>
        )}
        {group.description && (
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">{group.description}</p>
        )}
        <div className="mt-4 flex items-center justify-center gap-1 text-sm text-slate-500">
          <Users size={13} />
          {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
        </div>

        <div className="mt-7 flex flex-col gap-3">
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {joining ? 'Joining…' : 'Join Study Group'}
          </button>
          <Link
            href="/study-groups"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Maybe later
          </Link>
        </div>
      </div>
    </div>
  )
}
