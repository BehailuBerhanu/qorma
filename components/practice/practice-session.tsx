'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, ChevronRight, Flag, BookOpen } from 'lucide-react'
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
  questions: Question[]
}

type AnswerState = SubmitAnswerResult & { selectedOptionId: number }

export default function PracticeSession({ sessionId, questions }: Props) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isCompleting, startCompleting] = useTransition()
  const startTimeRef = useRef<number>(Date.now())

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const progress = Math.round(((currentIndex) / questions.length) * 100)

  // Reset timer when question changes
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
      const result = await submitAnswer(
        sessionId,
        currentQuestion.id,
        selectedOptionId,
        timeSpentMs
      )
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
    const base =
      'w-full flex items-start gap-3 rounded-xl border-2 p-4 text-left text-sm transition cursor-pointer'

    if (!answerState) {
      // Before submission
      if (selectedOptionId === optId) {
        return `${base} border-emerald-500 bg-emerald-50`
      }
      return `${base} border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40`
    }

    // After submission
    if (optId === answerState.correctOptionId) {
      return `${base} border-emerald-500 bg-emerald-50`
    }
    if (optId === answerState.selectedOptionId && !answerState.isCorrect) {
      return `${base} border-red-400 bg-red-50`
    }
    return `${base} border-slate-100 bg-white opacity-60`
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf9]">
      {/* Progress bar header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3 lg:px-8">
          <span className="text-sm font-medium text-slate-600 shrink-0">
            {currentIndex + 1} / {questions.length}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-emerald-700 shrink-0">{progress}%</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 lg:px-8">
        {/* Question */}
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
              <span className="flex-1 leading-snug pt-0.5">{opt.body}</span>
              {answerState && opt.id === answerState.correctOptionId && (
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
              )}
              {answerState && opt.id === answerState.selectedOptionId && !answerState.isCorrect && (
                <XCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
              )}
            </button>
          ))}
        </div>

        {/* Feedback panel — shown after submission */}
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
                <p className="text-sm leading-relaxed text-slate-700">
                  {answerState.explanation}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No explanation available for this question.</p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div />
          {!answerState ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOptionId || isPending}
              className="rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? 'Submitting…' : 'Submit Answer'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={isCompleting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isCompleting
                ? 'Saving…'
                : isLast
                ? 'See Results'
                : 'Next Question'}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </main>

      {/* Bottom question navigator (mobile) */}
      <div className="border-t border-slate-200 bg-white px-5 py-3 lg:hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => i < currentIndex && setCurrentIndex(i)}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${
                i === currentIndex
                  ? 'bg-emerald-600 text-white'
                  : i < currentIndex
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
