'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, ChevronRight, BookOpen, Clock, X, ArrowLeft } from 'lucide-react'
import {
  startChallengeAttempt,
  submitChallengeAnswer,
  completeChallengeAttempt,
} from '@/lib/actions/study-groups'
import type { ChallengeAnswerResult } from '@/lib/actions/study-groups'

// ─── Types ────────────────────────────────────────────────────────────────────

type Option = {
  id: number
  label: string
  body: string
  isCorrect: boolean
}

type Question = {
  id: number
  orderIndex: number
  body: string
  explanation: string | null
  options: Option[]
}

interface Challenge {
  id: number
  title: string
  timeLimitMins: number
  questionCount: number
}

interface Props {
  challenge: Challenge
  questions: Question[]
  existingAttemptId: number | null
  groupId: number
  groupName: string
}

type AnswerState = ChallengeAnswerResult & { selectedOptionId: number }

// ─── Timer ────────────────────────────────────────────────────────────────────

function useCountdown(limitMins: number, started: boolean, onExpire: () => void) {
  const [remaining, setRemaining] = useState(limitMins * 60)
  const expiredRef = useRef(false)

  useEffect(() => {
    if (!started) return
    const id = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          clearInterval(id)
          if (!expiredRef.current) {
            expiredRef.current = true
            onExpire()
          }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [started]) // eslint-disable-line react-hooks/exhaustive-deps

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const isWarning = remaining <= 60

  return { display, isWarning }
}

// ─── Option button styling ─────────────────────────────────────────────────────

function getOptionClass(optId: number, answerState: AnswerState | null, selectedOptionId: number | null): string {
  const base = 'w-full flex items-start gap-3 rounded-xl border-2 p-4 text-left text-sm transition cursor-pointer'
  if (!answerState) {
    if (selectedOptionId === optId) return `${base} border-emerald-500 bg-emerald-50`
    return `${base} border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40`
  }
  if (optId === answerState.correctOptionId) return `${base} border-emerald-500 bg-emerald-50`
  if (optId === answerState.selectedOptionId && !answerState.isCorrect) return `${base} border-red-400 bg-red-50`
  return `${base} border-slate-100 bg-white opacity-50`
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChallengeSession({
  challenge,
  questions,
  existingAttemptId,
  groupId,
  groupName,
}: Props) {
  const router = useRouter()
  const [attemptId, setAttemptId] = useState<number | null>(existingAttemptId)
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isCompleting, startCompleting] = useTransition()
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const sessionStartRef = useRef<number>(0)
  const questionStartRef = useRef<number>(Date.now())
  const navigateAfterCompleteRef = useRef<string | null>(null)

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const answeredCount = currentIndex + (answerState ? 1 : 0)
  const progress = Math.round((answeredCount / questions.length) * 100)

  // Navigate after completing transition finishes — avoids React error #441
  useEffect(() => {
    if (!isCompleting && navigateAfterCompleteRef.current) {
      const target = navigateAfterCompleteRef.current
      navigateAfterCompleteRef.current = null
      router.push(target)
    }
  }, [isCompleting, router])

  function handleExpire() {
    if (!attemptId) return
    const elapsed = Date.now() - sessionStartRef.current
    const target = `/study-groups/${groupId}/challenge/${challenge.id}`
    startCompleting(async () => {
      await completeChallengeAttempt(attemptId, elapsed)
      navigateAfterCompleteRef.current = target
    })
  }

  const { display: timerDisplay, isWarning } = useCountdown(
    challenge.timeLimitMins,
    started,
    handleExpire
  )

  // Reset per-question state on index change
  useEffect(() => {
    questionStartRef.current = Date.now()
    setSelectedOptionId(null)
    setAnswerState(null)
  }, [currentIndex])

  async function handleStart() {
    startTransition(async () => {
      const { attemptId: id } = await startChallengeAttempt(challenge.id)
      setAttemptId(id)
      sessionStartRef.current = Date.now()
      setStarted(true)
    })
  }

  function handleSelect(optionId: number) {
    if (answerState || isPending) return
    setSelectedOptionId(optionId)
  }

  function handleSubmit() {
    if (!selectedOptionId || !attemptId || answerState || isPending) return
    startTransition(async () => {
      const result = await submitChallengeAnswer(attemptId, currentQuestion.id, selectedOptionId)
      setAnswerState({ ...result, selectedOptionId })
    })
  }

  function handleNext() {
    if (isLast) {
      if (!attemptId) return
      const elapsed = Date.now() - sessionStartRef.current
      const target = `/study-groups/${groupId}/challenge/${challenge.id}`
      startCompleting(async () => {
        await completeChallengeAttempt(attemptId, elapsed)
        navigateAfterCompleteRef.current = target
      })
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  // ── Pre-start splash ──────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8faf9] px-5">
        <div className="dashboard-card w-full max-w-md p-8 text-center">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-600">
            Challenge
          </div>
          <h1 className="mb-1 text-xl font-bold text-slate-900">{challenge.title}</h1>
          <p className="mb-6 text-sm text-slate-500">{groupName}</p>

          <div className="mb-8 flex justify-center gap-6 text-sm">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-slate-800">{challenge.questionCount}</span>
              <span className="text-xs text-slate-500">Questions</span>
            </div>
            <div className="w-px bg-slate-100" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-slate-800">{challenge.timeLimitMins}</span>
              <span className="text-xs text-slate-500">Minutes</span>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={isPending}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {isPending ? 'Starting…' : 'Begin Challenge'}
          </button>
          <Link
            href={`/study-groups/${groupId}`}
            className="mt-3 block text-xs text-slate-500 hover:text-slate-700"
          >
            Back to group
          </Link>
        </div>
      </div>
    )
  }

  // ── Active session ─────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf9]">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3 lg:px-8">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
            aria-label="Exit challenge"
          >
            <X size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-slate-500">{challenge.title}</div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className={`flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums ${isWarning ? 'text-red-600' : 'text-slate-600'}`}>
            <Clock size={14} />
            {timerDisplay}
          </div>

          <span className="shrink-0 text-xs font-semibold text-slate-600">
            {currentIndex + 1}<span className="font-normal text-slate-400">/{questions.length}</span>
          </span>
        </div>
      </header>

      {/* Exit confirm overlay */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
          <div className="dashboard-card w-full max-w-sm p-6 text-center">
            <div className="mb-1 text-lg font-semibold">Leave this challenge?</div>
            <p className="mb-6 text-sm text-slate-500">
              Your progress is saved. The timer keeps running while you're away.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Keep going
              </button>
              <Link
                href={`/study-groups/${groupId}`}
                className="flex-1 rounded-xl bg-slate-800 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Exit
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 lg:px-8">

        {/* Question card */}
        <div className="dashboard-card mb-6 p-6">
          <span className="mb-4 inline-block rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
            Q{currentQuestion.orderIndex}
          </span>
          <p className="text-[17px] font-medium leading-relaxed text-slate-900">
            {currentQuestion.body}
          </p>
        </div>

        {/* Options */}
        <div className="mb-6 space-y-3">
          {currentQuestion.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={!!answerState || isPending}
              className={getOptionClass(opt.id, answerState, selectedOptionId)}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  answerState && opt.id === answerState.correctOptionId
                    ? 'bg-emerald-600 text-white'
                    : answerState && opt.id === answerState.selectedOptionId && !answerState.isCorrect
                    ? 'bg-red-500 text-white'
                    : selectedOptionId === opt.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {opt.label}
              </span>
              <span className="flex-1 pt-0.5 leading-snug">{opt.body}</span>
              {answerState && opt.id === answerState.correctOptionId && (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              )}
              {answerState && opt.id === answerState.selectedOptionId && !answerState.isCorrect && (
                <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              )}
            </button>
          ))}
        </div>

        {/* Feedback panel */}
        {answerState && (
          <div
            className={`mb-6 rounded-2xl border p-5 ${
              answerState.isCorrect
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="mb-3 flex items-center gap-2">
              {answerState.isCorrect ? (
                <>
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  <span className="font-semibold text-emerald-800">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle size={20} className="text-red-600" />
                  <span className="font-semibold text-red-800">Incorrect</span>
                </>
              )}
            </div>
            {answerState.explanation ? (
              <div className="flex gap-2">
                <BookOpen size={16} className="mt-0.5 shrink-0 text-slate-500" />
                <p className="text-sm leading-relaxed text-slate-700">{answerState.explanation}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No explanation available for this question.</p>
            )}
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between">
          {currentIndex > 0 && !answerState ? (
            <button
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={15} /> Back
            </button>
          ) : (
            <div />
          )}

          {!answerState ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOptionId || isPending}
              className="rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? 'Checking…' : 'Submit Answer'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={isCompleting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isCompleting ? 'Saving…' : isLast ? 'See Results' : 'Next Question'}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </main>

      {/* Mobile dot navigator */}
      <div className="border-t border-slate-200 bg-white px-5 py-3 lg:hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold ${
                i === currentIndex
                  ? 'bg-emerald-600 text-white'
                  : i < currentIndex
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
