'use client'

import { useRouter, usePathname } from 'next/navigation'
import { BookOpen, ChevronRight, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { subject, exam } from '@/lib/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

type Subject = InferSelectModel<typeof subject>
type Exam = InferSelectModel<typeof exam>

interface Props {
  exams: Exam[]
  subjects: Subject[]
  activeSubjectSlug: string | null
}

const SUBJECT_ICONS: Record<string, string> = {
  mathematics: '∑',
  physics: 'φ',
  chemistry: '⚗',
  biology: '🌿',
  english: 'Aa',
}

export default function ExamBrowser({ exams, subjects, activeSubjectSlug }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return exams
    return exams.filter((e) => e.label.toLowerCase().includes(q) || String(e.year).includes(q))
  }, [exams, query])

  function selectSubject(slug: string | null) {
    const params = slug ? `?subject=${slug}` : ''
    router.push(`/exams${params}`)
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
      {/* Page header */}
      <div className="mb-7">
        <p className="mb-1 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-700">Dashboard</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span>Past Exams</span>
        </p>
        <h1 className="text-[26px] font-semibold tracking-tight">Past Exams</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse EUEE past examination papers by year and subject.
        </p>
      </div>

      {/* Search */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by year…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
      </div>

      {/* Subject filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => selectSubject(null)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            !activeSubjectSlug
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          All Subjects
        </button>
        {subjects.map((s) => (
          <button
            key={s.slug}
            onClick={() => selectSubject(s.slug)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              activeSubjectSlug === s.slug
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            <span>{SUBJECT_ICONS[s.slug] ?? '📖'}</span>
            {s.name}
          </button>
        ))}
      </div>

      {/* Exam grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <BookOpen size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-500">No exams found</p>
          <p className="mt-1 text-sm text-slate-400">
            {query ? 'Try a different search term.' : 'Check back once exam data has been loaded.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <Link
              key={e.id}
              href={`/exams/${e.id}`}
              className="dashboard-card group flex items-center justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-lg font-bold text-emerald-700">
                    {e.year.toString().slice(2)}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900">{e.label}</div>
                    <div className="text-xs text-slate-500 capitalize">{e.examType.replace(/_/g, ' ')}</div>
                  </div>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
