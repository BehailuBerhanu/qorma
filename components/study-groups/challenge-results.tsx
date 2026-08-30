'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, ChevronDown, ChevronUp, BookOpen,
  Medal, Clock, Trophy, Users, ArrowLeft,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Challenge {
  id: number
  title: string
  timeLimitMins: number
  questionCount: number
  groupId: number
}

interface Option {
  id: number
  label: string
  body: string
  isCorrect: boolean
}

interface Question {
  id: number
  orderIndex: number
  body: string
  explanation: string | null
  options: Option[]
}

interface Attempt {
  id: number
  score: number
  total: number
  accuracy: number
  timeTakenMs: number | null
  completedAt: Date | null
}

interface AnswerRecord {
  questionId: number
  selectedOptionId: number | null
  isCorrect: boolean
}

interface LeaderboardEntry {
  userId: string
  userName: string
  score: number
  total: number
  accuracy: number
  timeTakenMs: number | null
  completedAt: Date | null
}

interface Props {
  challenge: Challenge
  questions: Question[]
  attempt: Attempt
  answers: AnswerRecord[]
  leaderboard: LeaderboardEntry[]
  groupId: number
  groupName: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ms: number | null): string {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function scoreColor(pct: number) {
  if (pct >= 70) return 'text-emerald-300'
  if (pct >= 50) return 'text-yellow-300'
  return 'text-red-300'
}

function medalIcon(rank: number) {
  if (rank === 1) return <Medal size={16} className="text-yellow-400" />
  if (rank === 2) return <Medal size={16} className="text-slate-400" />
  if (rank === 3) return <Medal size={16} className="text-amber-600" />
  return <span className="text-xs font-bold text-slate-400">#{rank}</span>
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReviewRow({ question, answer }: { question: Question; answer: AnswerRecord | undefined }) {
  const [open, setOpen] = useState(false)
  const correctOpt = question.options.find((o) => o.isCorrect)
  const correct = answer?.isCorrect ?? false

  return (
    <div className="dashboard-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left hover:bg-slate-50"
      >
        <span className="mt-0.5 shrink-0">
          {correct ? (
            <CheckCircle2 size={18} className="text-emerald-600" />
          ) : (
            <XCircle size={18} className="text-red-500" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <span className="mr-2 text-xs font-bold text-slate-400">Q{question.orderIndex}</span>
          <span className="line-clamp-2 text-sm font-medium text-slate-800">{question.body}</span>
        </div>
        {open ? (
          <ChevronUp size={16} className="ml-2 mt-0.5 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown size={16} className="ml-2 mt-0.5 shrink-0 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="mb-4 space-y-2">
            {question.options.map((opt) => (
              <div
                key={opt.id}
                className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                  opt.isCorrect
                    ? 'bg-emerald-50 text-emerald-800'
                    : opt.id === answer?.selectedOptionId && !correct
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

          {question.explanation && (
            <div className="flex gap-2 rounded-xl bg-slate-50 px-3 py-3">
              <BookOpen size={15} className="mt-0.5 shrink-0 text-slate-400" />
              <p className="text-xs leading-relaxed text-slate-600">{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChallengeResults({
  challenge,
  questions,
  attempt,
  answers,
  leaderboard,
  groupId,
  groupName,
}: Props) {
  const [activeTab, setActiveTab] = useState<'review' | 'leaderboard'>('leaderboard')

  const pct = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0
  const statusLabel =
    pct >= 80 ? 'Outstanding!' : pct >= 60 ? 'Great work!' : pct >= 40 ? 'Keep practicing.' : 'Keep going!'

  const answerMap = new Map(answers.map((a) => [a.questionId, a]))

  return (
    <div className="min-h-screen bg-[#f8faf9]">

      {/* ── Score hero ── */}
      <div className="bg-[#03251d] px-5 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/study-groups/${groupId}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-emerald-300 transition hover:text-white"
          >
            <ArrowLeft size={14} />
            {groupName}
          </Link>

          <div className="text-center">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-300">
              Challenge Complete
            </p>
            <p className="mb-1 text-sm text-emerald-100/70">{challenge.title}</p>
            <h1 className="mb-6 text-2xl font-semibold">{statusLabel}</h1>

            <div className={`text-7xl font-bold tracking-tight ${scoreColor(pct)}`}>{pct}%</div>
            <p className="mt-1 text-sm text-emerald-100/70">
              {attempt.score} correct out of {attempt.total}
            </p>

            <div className="mt-7 flex justify-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-300">{attempt.score}</div>
                <div className="text-emerald-100/70">Correct</div>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-bold text-red-300">{attempt.total - attempt.score}</div>
                <div className="text-emerald-100/70">Incorrect</div>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <div className="flex items-center gap-1 text-2xl font-bold text-white">
                  <Clock size={18} />
                  {formatTime(attempt.timeTakenMs)}
                </div>
                <div className="text-emerald-100/70">Time taken</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-5 lg:px-8">
          {[
            { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
            { id: 'review' as const, label: 'Question Review', icon: BookOpen },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === t.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 py-6 lg:px-8">

        {/* ── Leaderboard tab ── */}
        {activeTab === 'leaderboard' && (
          <div>
            <h2 className="section-title mb-4">
              <span className="flex items-center gap-2">
                <Users size={16} />
                {leaderboard.length} Participant{leaderboard.length !== 1 ? 's' : ''}
              </span>
            </h2>

            {leaderboard.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                No completed attempts yet.
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div
                    key={entry.userId}
                    className={`dashboard-card flex items-center gap-3 px-4 py-3 ${
                      i === 0 ? 'ring-2 ring-yellow-200' : ''
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                      {medalIcon(i + 1)}
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                      {entry.userName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800">{entry.userName}</div>
                      <div className="mt-0.5 flex gap-3 text-[11px] text-slate-500">
                        <span>{entry.score}/{entry.total} correct</span>
                        <span className="flex items-center gap-0.5">
                          <Clock size={10} />
                          {formatTime(entry.timeTakenMs)}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`text-lg font-bold tabular-nums ${
                        entry.accuracy >= 70
                          ? 'text-emerald-600'
                          : entry.accuracy >= 50
                          ? 'text-yellow-600'
                          : 'text-red-500'
                      }`}
                    >
                      {entry.accuracy}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Review tab ── */}
        {activeTab === 'review' && (
          <div>
            <h2 className="section-title mb-4">Question Review</h2>
            {answers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                Answer review is not available for this attempt.
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q) => (
                  <ReviewRow key={q.id} question={q} answer={answerMap.get(q.id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
