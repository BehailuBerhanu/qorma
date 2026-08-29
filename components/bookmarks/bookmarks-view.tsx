'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bookmark,
  BookOpen,
  Calendar,
  ChevronRight,
  Search,
  Trash2,
  LayoutDashboard,
} from 'lucide-react'
import { removeBookmark } from '@/lib/actions/bookmarks'
import type { BookmarkedQuestion } from '@/lib/db/queries/bookmarks'

interface Props {
  bookmarks: BookmarkedQuestion[]
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
        <Bookmark size={28} className="text-emerald-600" strokeWidth={1.5} />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-slate-900">
        Your saved questions will appear here
      </h2>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-slate-500">
        While practising, tap the bookmark icon on any question to save it for later review.
        Difficult questions are great candidates.
      </p>
      <Link
        href="/exams"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        <BookOpen size={15} />
        Browse Exams
      </Link>
    </div>
  )
}

function BookmarkCard({
  bm,
  onRemove,
}: {
  bm: BookmarkedQuestion
  onRemove: (questionId: number) => void
}) {
  const [removing, startRemove] = useTransition()

  function handleRemove() {
    startRemove(async () => {
      await removeBookmark(bm.questionId)
      onRemove(bm.questionId)
    })
  }

  return (
    <div
      className={`dashboard-card overflow-hidden transition ${removing ? 'opacity-50' : ''}`}
    >
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {bm.examLabel}
        </span>
        <span className="text-slate-300">·</span>
        <span className="text-[11px] font-medium text-slate-500">{bm.subjectName}</span>
        {bm.topicName && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] text-slate-400">{bm.topicName}</span>
          </>
        )}
        {bm.difficulty && (
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
              DIFFICULTY_COLORS[bm.difficulty] ?? 'bg-slate-100 text-slate-600'
            }`}
          >
            {bm.difficulty}
          </span>
        )}
      </div>

      {/* Question body */}
      <div className="px-4 py-3">
        <div className="mb-1.5 flex items-start gap-2">
          <span className="mt-0.5 shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
            Q{bm.orderIndex}
          </span>
          <p className="line-clamp-3 text-sm font-medium leading-snug text-slate-800">
            {bm.questionBody}
          </p>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Calendar size={11} />
          <span>Saved {formatDate(bm.bookmarkedAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRemove}
            disabled={removing}
            aria-label="Remove bookmark"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
          <Link
            href="/exams"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
          >
            Practice
            <ChevronRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function BookmarksView({ bookmarks: initialBookmarks }: Props) {
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState(initialBookmarks)
  const [query, setQuery] = useState('')

  function handleRemove(questionId: number) {
    setBookmarks((prev) => prev.filter((b) => b.questionId !== questionId))
    router.refresh()
  }

  const filtered = bookmarks.filter((b) => {
    const q = query.toLowerCase()
    return (
      b.questionBody.toLowerCase().includes(q) ||
      b.subjectName.toLowerCase().includes(q) ||
      b.examLabel.toLowerCase().includes(q) ||
      (b.topicName?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-700"
          >
            <LayoutDashboard size={13} />
            Dashboard
          </Link>
          <h1 className="section-title flex items-center gap-2">
            <Bookmark size={20} className="text-emerald-600" />
            Bookmarks
          </h1>
          {bookmarks.length > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              {bookmarks.length} saved question{bookmarks.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {bookmarks.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter bookmarks…"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        )}
      </div>

      {bookmarks.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">
          No bookmarks match <strong>"{query}"</strong>.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((bm) => (
            <BookmarkCard key={bm.bookmarkId} bm={bm} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  )
}
