'use client'

import { useState, useTransition } from 'react'
import { Bookmark } from 'lucide-react'
import { toggleBookmark } from '@/lib/actions/bookmarks'

interface Props {
  questionId: number
  initialBookmarked: boolean
}

export default function BookmarkButton({ questionId, initialBookmarked }: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    if (isPending) return
    const next = !bookmarked
    setBookmarked(next) // optimistic
    startTransition(async () => {
      try {
        const result = await toggleBookmark(questionId, bookmarked)
        setBookmarked(result.bookmarked)
      } catch {
        setBookmarked(bookmarked) // revert on error
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this question'}
      title={bookmarked ? 'Remove bookmark' : 'Save for later'}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-50 ${
        bookmarked
          ? 'text-emerald-600 hover:text-emerald-700'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
      }`}
    >
      <Bookmark
        size={17}
        strokeWidth={2}
        className={bookmarked ? 'fill-emerald-600' : ''}
      />
    </button>
  )
}
