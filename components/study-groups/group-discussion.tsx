'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen, ChevronDown, ChevronUp, MessageSquare,
  MoreHorizontal, Pin, Send, Trash2, Flag,
} from 'lucide-react'
import { createPost, createComment, deletePost, deleteComment, pinPost, reportContent } from '@/lib/actions/study-groups'
import QuestionAttacher from './question-attacher'

interface Comment {
  id: number
  content: string
  createdAt: Date
  userId: string
  userName: string
  postId: number
}

interface AttachedQ {
  questionId: number
  body: string
  orderIndex: number
  examLabel: string
  subjectName: string
}

interface Post {
  id: number
  content: string
  isPinned: boolean
  createdAt: Date
  userId: string
  userName: string
  questionId: number | null
  attachedQuestion: AttachedQ | null
  comments: Comment[]
}

interface Props {
  groupId: number
  currentUserId: string
  posts: Post[]
  isMember: boolean
  isAdminOrOwner: boolean
}

function timeAgo(date: Date): string {
  const d = new Date(date)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white">
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

function QuestionCard({ q }: { q: AttachedQ }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
      <div className="flex items-center gap-2 border-b border-emerald-100 px-3 py-2">
        <BookOpen size={13} className="text-emerald-600" />
        <span className="text-xs font-semibold text-emerald-700">
          {q.examLabel} · {q.subjectName} · Q{q.orderIndex}
        </span>
      </div>
      <p className="px-3 py-2 text-sm text-slate-800 line-clamp-3">{q.body}</p>
    </div>
  )
}

function PostCard({
  post, currentUserId, groupId, isAdminOrOwner,
}: {
  post: Post
  currentUserId: string
  groupId: number
  isAdminOrOwner: boolean
}) {
  const router = useRouter()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [submitting, startSubmit] = useTransition()
  const [deleting, startDelete] = useTransition()

  const canModerate = isAdminOrOwner || post.userId === currentUserId

  function submitComment() {
    if (!commentText.trim()) return
    startSubmit(async () => {
      await createComment(groupId, post.id, commentText)
      setCommentText('')
      router.refresh()
    })
  }

  function handleDeletePost() {
    startDelete(async () => {
      await deletePost(groupId, post.id)
      router.refresh()
    })
    setMenuOpen(false)
  }

  function handlePin(pinned: boolean) {
    startDelete(async () => {
      await pinPost(groupId, post.id, pinned)
      router.refresh()
    })
    setMenuOpen(false)
  }

  function handleReport() {
    reportContent({ postId: post.id, reason: 'inappropriate_content' })
    setMenuOpen(false)
    alert('Report submitted. Thank you.')
  }

  return (
    <div className={`dashboard-card overflow-hidden ${post.isPinned ? 'border-emerald-300' : ''}`}>
      {post.isPinned && (
        <div className="flex items-center gap-1.5 border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
          <Pin size={11} />
          Pinned
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar name={post.userName} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-sm font-semibold text-slate-800">{post.userName}</span>
                <span className="ml-2 text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <MoreHorizontal size={15} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {isAdminOrOwner && (
                      <button
                        onClick={() => handlePin(!post.isPinned)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Pin size={13} />
                        {post.isPinned ? 'Unpin' : 'Pin post'}
                      </button>
                    )}
                    {canModerate && (
                      <button
                        onClick={handleDeletePost}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    )}
                    {!canModerate && (
                      <button
                        onClick={handleReport}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Flag size={13} />
                        Report
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-800">{post.content}</p>
            {post.attachedQuestion && <QuestionCard q={post.attachedQuestion} />}
          </div>
        </div>

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
        >
          <MessageSquare size={13} />
          {post.comments.length > 0
            ? `${post.comments.length} comment${post.comments.length !== 1 ? 's' : ''}`
            : 'Reply'}
          {post.comments.length > 0 && (
            showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />
          )}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          {post.comments.map((c) => (
            <div key={c.id} className="mb-3 flex items-start gap-2.5">
              <Avatar name={c.userName} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">{c.userName}</span>
                  <span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>
                  {(c.userId === currentUserId || isAdminOrOwner) && (
                    <button
                      onClick={() => {
                        deleteComment(groupId, c.id).then(() => router.refresh())
                      }}
                      className="ml-auto text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-700">{c.content}</p>
              </div>
            </div>
          ))}
          {/* Comment input */}
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submitComment()}
              placeholder="Write a reply…"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              onClick={submitComment}
              disabled={submitting || !commentText.trim()}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white disabled:opacity-40"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GroupDiscussion({
  groupId, currentUserId, posts, isMember, isAdminOrOwner,
}: Props) {
  const router = useRouter()
  const [postContent, setPostContent] = useState('')
  const [attachedQ, setAttachedQ] = useState<AttachedQ | null>(null)
  const [showAttach, setShowAttach] = useState(false)
  const [submitting, startSubmit] = useTransition()

  function handlePost() {
    if (!postContent.trim()) return
    startSubmit(async () => {
      await createPost(groupId, postContent, attachedQ?.questionId)
      setPostContent('')
      setAttachedQ(null)
      setShowAttach(false)
      router.refresh()
    })
  }

  const pinnedPosts = posts.filter((p) => p.isPinned)
  const regularPosts = posts.filter((p) => !p.isPinned)

  return (
    <div>
      {/* Post composer */}
      {isMember && (
        <div className="dashboard-card mb-5 p-4">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="Ask a question, share insight, or discuss a problem…"
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          {attachedQ && (
            <div className="mt-2">
              <QuestionCard q={attachedQ} />
              <button
                onClick={() => setAttachedQ(null)}
                className="mt-1 text-xs text-red-500 hover:underline"
              >
                Remove question
              </button>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => setShowAttach((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <BookOpen size={13} />
              Attach Question
            </button>
            <button
              onClick={handlePost}
              disabled={submitting || !postContent.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send size={13} />
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
          {showAttach && (
            <QuestionAttacher
              onSelect={(q) => {
                setAttachedQ(q)
                setShowAttach(false)
              }}
              onClose={() => setShowAttach(false)}
            />
          )}
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center">
          <MessageSquare size={28} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">Start the discussion</p>
          <p className="mt-1 text-xs text-slate-500">
            {isMember
              ? 'Post a question, share a resource, or discuss exam topics.'
              : 'Join this group to participate in discussions.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pinnedPosts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              currentUserId={currentUserId}
              groupId={groupId}
              isAdminOrOwner={isAdminOrOwner}
            />
          ))}
          {regularPosts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              currentUserId={currentUserId}
              groupId={groupId}
              isAdminOrOwner={isAdminOrOwner}
            />
          ))}
        </div>
      )}
    </div>
  )
}
