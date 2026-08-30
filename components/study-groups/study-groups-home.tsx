'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen, ChevronRight, Globe, Lock, Plus, Search, Users,
} from 'lucide-react'
import { joinStudyGroup } from '@/lib/actions/study-groups'

type Group = {
  id: number
  name: string
  description: string | null
  privacy: string
  examId: number | null
  examLabel: string | null
  memberCount: number
  subjects: string[]
  role?: string
}

interface Props {
  user: { id: string; name: string }
  myGroups: Group[]
  discoverGroups: Group[]
}

function GroupCard({ group, showRole }: { group: Group; showRole?: boolean }) {
  const router = useRouter()
  const [joining, setJoining] = useState(false)

  async function handleJoin() {
    setJoining(true)
    try {
      await joinStudyGroup(group.id)
      router.refresh()
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="dashboard-card flex flex-col p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {group.privacy === 'private' ? (
              <Lock size={13} className="shrink-0 text-slate-400" />
            ) : (
              <Globe size={13} className="shrink-0 text-emerald-500" />
            )}
            {showRole && group.role && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                {group.role}
              </span>
            )}
          </div>
          <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-slate-900">
            {group.name}
          </h3>
        </div>
      </div>

      {group.examLabel && (
        <div className="mb-2 text-xs font-medium text-emerald-700">{group.examLabel}</div>
      )}

      {group.subjects.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {group.subjects.map((s) => (
            <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
              {s}
            </span>
          ))}
        </div>
      )}

      {group.description && (
        <p className="mb-3 line-clamp-2 text-xs text-slate-500">{group.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Users size={12} />
          <span>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
        </div>
        {showRole ? (
          <Link
            href={`/study-groups/${group.id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            Open <ChevronRight size={12} />
          </Link>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
          >
            {joining ? 'Joining…' : 'Join Group'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function StudyGroupsHome({ user, myGroups, discoverGroups }: Props) {
  const [query, setQuery] = useState('')

  const filterGroups = (groups: Group[]) =>
    query
      ? groups.filter(
          (g) =>
            g.name.toLowerCase().includes(query.toLowerCase()) ||
            (g.examLabel?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
            g.subjects.some((s) => s.toLowerCase().includes(query.toLowerCase()))
        )
      : groups

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title text-[26px]">Study Groups</h1>
          <p className="mt-1 text-sm text-slate-500">
            Learn together. Practice together. Master more.
          </p>
        </div>
        <Link
          href="/study-groups/create"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus size={16} />
          Create Group
        </Link>
      </div>

      <div className="relative mb-8 w-full max-w-sm">
        <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search groups, exams, subjects…"
          className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
      </div>

      <section className="mb-10">
        <h2 className="section-title mb-4">My Groups</h2>
        {myGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <Users size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">Find your study community</p>
            <p className="mt-1 text-sm text-slate-500">
              Join a group below or{' '}
              <Link href="/study-groups/create" className="text-emerald-700 underline">
                create one
              </Link>{' '}
              to start learning together.
            </p>
          </div>
        ) : filterGroups(myGroups).length === 0 ? (
          <p className="text-sm text-slate-500">No groups match your search.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filterGroups(myGroups).map((g) => (
              <GroupCard key={g.id} group={g} showRole />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title mb-4">Discover Groups</h2>
        {discoverGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
            <p className="text-sm text-slate-500">
              No public groups yet.{' '}
              <Link href="/study-groups/create" className="text-emerald-700 underline">
                Be the first to create one.
              </Link>
            </p>
          </div>
        ) : filterGroups(discoverGroups).length === 0 ? (
          <p className="text-sm text-slate-500">No groups match your search.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filterGroups(discoverGroups).map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
