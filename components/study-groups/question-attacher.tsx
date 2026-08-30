'use client'

import { useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { searchQuestions } from '@/lib/db/queries/study-groups'

interface QuestionResult {
  id: number
  body: string
  orderIndex: number
  examId: number
  examLabel: string
  subjectName: string
}

interface Props {
  onSelect: (q: { questionId: number; body: string; orderIndex: number; examLabel: string; subjectName: string }) => void
  onClose: () => void
}

export default function QuestionAttacher({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QuestionResult[]>([])
  const [searching, startSearch] = useTransition()

  function handleSearch(q: string) {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    startSearch(async () => {
      const rows = await searchQuestions(q, undefined, undefined, 8)
      setResults(rows)
    })
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <Search size={14} className="text-slate-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search exam questions…"
          className="flex-1 text-sm outline-none"
        />
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={14} />
        </button>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {searching && (
          <div className="px-3 py-4 text-center text-xs text-slate-400">Searching…</div>
        )}
        {!searching && query.length >= 2 && results.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-slate-400">No questions found</div>
        )}
        {!searching && query.length < 2 && (
          <div className="px-3 py-4 text-center text-xs text-slate-400">
            Type at least 2 characters to search
          </div>
        )}
        {results.map((r) => (
          <button
            key={r.id}
            onClick={() =>
              onSelect({
                questionId: r.id,
                body: r.body,
                orderIndex: r.orderIndex,
                examLabel: r.examLabel,
                subjectName: r.subjectName,
              })
            }
            className="flex w-full flex-col gap-0.5 border-b border-slate-50 px-3 py-2.5 text-left transition hover:bg-emerald-50"
          >
            <div className="text-[10px] font-semibold text-emerald-700">
              {r.examLabel} · {r.subjectName} · Q{r.orderIndex}
            </div>
            <div className="line-clamp-2 text-xs text-slate-700">{r.body}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
