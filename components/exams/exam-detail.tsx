'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createPracticeSession } from '@/lib/actions/practice'
import type { exam, subject } from '@/lib/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

type Exam = InferSelectModel<typeof exam>
type SubjectWithCount = InferSelectModel<typeof subject> & { questionCount: number }

interface Props {
  exam: Exam
  subjects: SubjectWithCount[]
}

const SUBJECT_COLORS: Record<string, string> = {
  mathematics: 'bg-blue-50 text-blue-700 border-blue-100',
  physics: 'bg-purple-50 text-purple-700 border-purple-100',
  chemistry: 'bg-orange-50 text-orange-700 border-orange-100',
  biology: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  english: 'bg-rose-50 text-rose-700 border-rose-100',
}

const SUBJECT_BG: Record<string, string> = {
  mathematics: '#1d4ed8',
  physics: '#7c3aed',
  chemistry: '#c2410c',
  biology: '#047857',
  english: '#be123c',
}

export default function ExamDetail({ exam, subjects }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [startingSubjectId, setStartingSubjectId] = useState<number | null>(null)

  function handleStart(subjectId: number) {
    setStartingSubjectId(subjectId)
    startTransition(async () => {
      const { sessionId } = await createPracticeSession(exam.id, subjectId)
      router.push(`/practice/${sessionId}`)
    })
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      {/* Breadcrumb */}
      <p className="mb-5 text-sm text-slate-500">
        <Link href="/" className="hover:text-emerald-700">Dashboard</Link>
        <span className="mx-2 text-slate-300">/</span>
        <Link href="/exams" className="hover:text-emerald-700">Past Exams</Link>
        <span className="mx-2 text-slate-300">/</span>
        <span>{exam.label}</span>
      </p>

      {/* Exam header card */}
      <div className="mb-7 rounded-2xl bg-[#03251d] p-7 text-white">
        <div className="mb-2 text-xs font-bold tracking-[0.2em] text-emerald-300 uppercase">
          {exam.examType.toUpperCase().replace('_', ' ')}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{exam.label}</h1>
        <p className="mt-2 text-sm text-emerald-100/80">
          {subjects.length} subject{subjects.length !== 1 ? 's' : ''} available
          {' · '}
          {subjects.reduce((sum, s) => sum + s.questionCount, 0)} questions total
        </p>
      </div>

      {/* Subject selection */}
      <h2 className="section-title mb-4">Select a subject to practice</h2>

      {subjects.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No questions loaded yet for this exam.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.map((s) => {
            const isStarting = pending && startingSubjectId === s.id
            const colorClass = SUBJECT_COLORS[s.slug] ?? 'bg-slate-50 text-slate-700 border-slate-100'
            return (
              <div
                key={s.id}
                className="dashboard-card flex items-center justify-between p-5"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-bold ${colorClass}`}
                  >
                    {s.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.questionCount} questions</div>
                  </div>
                </div>
                <button
                  onClick={() => handleStart(s.id)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isStarting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <>
                      Practice <ChevronRight size={15} />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
