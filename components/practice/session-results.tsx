'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, RotateCcw, LayoutDashboard, BookOpen } from 'lucide-react'
import type { practiceSession, sessionAnswer, question, option } from '@/lib/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

type Session = InferSelectModel<typeof practiceSession>
type Answer = {
  answerId: number
  isCorrect: boolean
  selectedOptionId: number | null
  timeSpentMs: number | null
  questionId: number
  questionBody: string
  explanation: string | null
  orderIndex: number
  options: InferSelectModel<typeof option>[]
}

interface Props {
  results: {
    session: Session
    answers: Answer[]
  }
  examLabel: string
  subjectName: string
}

function formatTime(ms: number | null): string {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function ScoreCircle({ score, total }: { score: number; total: number }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const color =
    pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500'
  return (
    <div className="flex flex-col items-center">
      <div className={`text-6xl font-bold tracking-tight ${color}`}>{pct}%</div>
      <div className="mt-1 text-sm text-slate-500">
        {score} correct out of {total}
      </div>
    </div>
  )
}

function AnswerRow({ answer }: { answer: Answer }) {
  const [open, setOpen] = useState(false)
  const correctOpt = answer.options.find((o) => o.isCorrect)
  const selectedOpt = answer.options.find((o) => o.id === answer.selectedOptionId)

  return (
    <div className="dashboard-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left hover:bg-slate-50"
      >
        <span className="mt-0.5 shrink-0">
          {answer.isCorrect ? (
            <CheckCircle2 size={18} className="text-emerald-600" />
          ) : (
            <XCircle size={18} className="text-red-500" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <span className="mr-2 text-xs font-bold text-slate-400">Q{answer.orderIndex}</span>
          <span className="text-sm font-medium text-slate-800 line-clamp-2">{answer.questionBody}</span>
        </div>
        <span className="ml-3 shrink-0 text-xs text-slate-400">{formatTime(answer.timeSpentMs)}</span>
        {open ? (
          <ChevronUp size={16} className="ml-2 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown size={16} className="ml-2 shrink-0 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          {/* Options */}
          <div className="mb-4 space-y-2">
            {answer.options.map((opt) => (
              <div
                key={opt.id}
                className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                  opt.isCorrect
                    ? 'bg-emerald-50 text-emerald-800'
                    : opt.id === answer.selectedOptionId && !answer.isCorrect
                    ? 'bg-red-50 text-red-800'
                    : 'text-slate-600'
                }`}
              >
                <span className="shrink-0 font-bold">{opt.label}.</span>
                <span>{opt.body}</span>
                {opt.isCorrect && (
                  <CheckCircle2 size={14} className="ml-auto mt-0.5 shrink-0 text-emerald-600" />
                )}
              </div>
            ))}
          </div>

          {/* Explanation */}
          {answer.explanation && (
            <div className="flex gap-2 rounded-xl bg-slate-50 px-3 py-3">
              <BookOpen size={15} className="mt-0.5 shrink-0 text-slate-400" />
              <p className="text-xs leading-relaxed text-slate-600">{answer.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SessionResults({ results, examLabel, subjectName }: Props) {
  const { session, answers } = results
  const correct = answers.filter((a) => a.isCorrect).length
  const total = answers.length
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0

  const statusLabel =
    pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good effort!' : pct >= 40 ? 'Keep practicing.' : 'Keep going!'

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      {/* Results summary card */}
      <div className="mb-7 rounded-2xl bg-[#03251d] px-7 py-8 text-white text-center">
        <p className="mb-1 text-xs font-bold tracking-[0.2em] text-emerald-300 uppercase">
          Practice Complete
        </p>
        <p className="mb-1 text-sm text-emerald-100/70">
          {examLabel} · {subjectName}
        </p>
        <h1 className="mb-6 text-2xl font-semibold">{statusLabel}</h1>
        <ScoreCircle score={correct} total={total} />

        <div className="mt-7 flex justify-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-300">{correct}</div>
            <div className="text-emerald-100/70">Correct</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-bold text-red-300">{total - correct}</div>
            <div className="text-emerald-100/70">Incorrect</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{total}</div>
            <div className="text-emerald-100/70">Total</div>
          </div>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/exams"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <RotateCcw size={15} />
          Practice Another Exam
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <LayoutDashboard size={15} />
          Back to Dashboard
        </Link>
      </div>

      {/* Per-question review */}
      <h2 className="section-title mb-4">Question Review</h2>
      <div className="space-y-3">
        {answers.map((a) => (
          <AnswerRow key={a.answerId} answer={a} />
        ))}
      </div>
    </div>
  )
}
