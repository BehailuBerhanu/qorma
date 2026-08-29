'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, ChevronRight, Loader2 } from 'lucide-react'
import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { createPracticeSession } from '@/lib/actions/practice'
import type { subject, exam } from '@/lib/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

type Subject = InferSelectModel<typeof subject>
type Exam = InferSelectModel<typeof exam>

interface Props {
  exams: Exam[]
  subjects: Subject[]
  activeSubjectSlug: string | null
  activeSubject: Subject | null
}

const SUBJECT_ICONS: Record<string, string> = {
  mathematics: '∑',
  physics: 'φ',
  chemistry: '⚗',
  biology: '🌿',
  english: 'Aa',
}

export default function ExamBrowser({ exams, subjects, activeSubjectSlug, activeSubject }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [startingExamId, setStartingExamId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return exams
    return exams.filter((e) => e.label.toLowerCase().includes(q) || String(e.year).includes(q))
  }, [exams, query])

  function selectSubject(slug: string | null) {
    const params = slug ? `?subject=${slug}` : ''
    router.push(`/exams${params}`)
  }

  // When a subject is active, clicking an exam card starts a practice session directly
  function handleExamClick(examId: number) {
    if (!activeSubject) return
    setStartingExamId(examId)
    startTransition(async () => {
      const { sessionId } = await createPracticeSession(examId, activeSubject.id)
      router.push(`/practice/${sessionId}`)
    })
  }

  const isSubjectFiltered = !!activeSubject

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
      {/* Page header */}
      <div className="mb-7">
        <p className="mb-1 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-700">Dashboard</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span>Past Exams</span>
          {activeSubject && (
            <>
              <span className="mx-2 text-slate-300">/</span>
              <span>{activeSubject.name}</span>
            </>
          )}
        </p>
        <h1 className="text-[26px] font-semibold tracking-tight">
          {activeSubject ? `${activeSubject.name} — Past Exams` : 'Past Exams'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {activeSubject
            ? `Select a year to start practicing ${activeSubject.name}.`
            : 'Browse EUEE past examination papers by year and subject.'}
        </p>
      </div>

      {/* Search */}
      <div className="mb-5">
        <label className="relative block max-w-sm">
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
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
            {query ? 'Try a different search term.' : 'No data loaded for this subject yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => {
            const isStarting = isPending && startingExamId === e.id

            if (isSubjectFiltered) {
              // Subject is selected — clicking starts practice directly
              return (
                <button
                  key={e.id}
                  onClick={() => handleExamClick(e.id)}
                  disabled={isPending}
                  className="dashboard-card group flex items-center justify-between p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-lg font-bold text-emerald-700">
                      {e.year.toString().slice(2)}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{e.label}</div>
                      <div className="text-xs text-emerald-700 font-medium">
                        {activeSubject!.name}
                      </div>
                    </div>
                  </div>
                  {isStarting ? (
                    <Loader2 size={18} className="shrink-0 animate-spin text-emerald-600" />
                  ) : (
                    <ChevronRight
                      size={18}
                      className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600"
                    />
                  )}
                </button>
              )
            }

            // No subject selected — go to exam detail to pick a subject
            return (
              <Link
                key={e.id}
                href={`/exams/${e.id}`}
                className="dashboard-card group flex items-center justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-lg font-bold text-emerald-700">
                    {e.year.toString().slice(2)}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900">{e.label}</div>
                    <div className="text-xs text-slate-500 capitalize">
                      {e.examType.toUpperCase().replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600"
                />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
