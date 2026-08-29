'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, ChevronRight, BookOpen, ArrowLeft, X } from 'lucide-react'
import { submitAnswer, completePracticeSession } from '@/lib/actions/practice'
import type { SubmitAnswerResult } from '@/lib/actions/practice'

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

interface Props {
  sessionId: number
  examId: number
  subjectId: number
  examLabel: string
  subjectName: string
  questions: Question[]
}

type AnswerState = SubmitAnswerResult & { selectedOptionId: number }

export default function PracticeSession({
  sessionId,
  examLabel,
  subjectName,
  questions,
}: Props) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isCompleting, startCompleting] = useTransition()
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const startTimeRef = useRef<number>(Date.now())

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const answeredCount = currentIndex + (answerState ? 1 : 0)
  const progress = Math.round((answeredCount / questions.length) * 100)

  useEffect(() => {
    startTimeRef.current = Date.now()
    setSelectedOptionId(null)
    setAnswerState(null)
  }, [currentIndex])

  function handleSelect(optionId: number) {
    if (answerState || isPending) return
    setSelectedOptionId(optionId)
  }

  function handleSubmit() {
    if (!selectedOptionId || answerState || isPending) return
    const timeSpentMs = Date.now() - startTimeRef.current
    startTransition(async () => {
      const result = await submitAnswer(sessionId, currentQuestion.id, selectedOptionId, timeSpentMs)
      setAnswerState({ ...result, selectedOptionId })
    })
  }

  function handleNext() {
    if (isLast) {
      startCompleting(async () => {
        await completePracticeSession(sessionId)
        router.push(`/practice/${sessionId}/results`)
      })
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  function getOptionClass(optId: number): string {
    const base = 'w-full flex items-start gap-3 rounded-xl border-2 p-4 text-left text-sm transition cursor-pointer'
    if (!answerState) {
      if (selectedOptionId === optId) return `${base} border-emerald-500 bg-emerald-50`
      return `${base} border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40`
    }
    if (optId === answerState.correctOptionId) return `${base} border-emerald-500 bg-emerald-50`
    if (optId === answerState.selectedOptionId && !answerState.isCorrect) return `${base} border-red-400 bg-red-50`
    return `${base} border-slate-100 bg-white opacity-50`
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf9]">

      {/* ── Top header ── */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3 lg:px-8">

          {/* Back / exit button */}
          <button
            onClick={() => setShowExitConfirm(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Exit practice"
          >
            <X size={18} />
          </button>

          {/* Context label */}
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-slate-500">
              {examLabel} · {subjectName}
            </div>
            {/* Progress bar */}
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question counter */}
          <span className="shrink-0 text-xs font-semibold text-slate-600">
            {currentIndex + 1}<span className="font-normal text-slate-400">/{questions.length}</span>
          </span>
        </div>
      </header>

      {/* ── Exit confirmation overlay ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
          <div className="dashboard-card w-full max-w-sm p-6 text-center">
            <div className="mb-1 text-lg font-semibold">Leave this session?</div>
            <p className="mb-6 text-sm text-slate-500">
              Your progress so far is saved. You can resume later from the exam browser.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Keep going
              </button>
              <Link
                href="/exams"
                className="flex-1 rounded-xl bg-slate-800 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Exit
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 lg:px-8">

        {/* Question card */}
        <div className="dashboard-card mb-6 p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
              Q{currentQuestion.orderIndex}
            </span>
          </div>
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
              className={getOptionClass(opt.id)}
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
              answerState.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
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
          {/* Skip back on mobile (previously answered) */}
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

      {/* ── Mobile question dot navigator ── */}
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
