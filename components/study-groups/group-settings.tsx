'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, Check, Copy, Globe, Lock, RefreshCw, Save, Trash2,
} from 'lucide-react'
import {
  updateStudyGroup,
  regenerateInviteToken,
  deleteStudyGroup,
  leaveStudyGroup,
} from '@/lib/actions/study-groups'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'owner' | 'admin' | 'member'

interface Group {
  id: number
  name: string
  description: string | null
  privacy: string
  goal: string | null
  inviteToken: string | null
  subjects: Array<{ id: number; name: string; slug: string; iconName: string }>
}

interface Props {
  group: Group
  currentUserRole: Role
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GroupSettings({ group, currentUserRole }: Props) {
  const router = useRouter()
  const isOwner = currentUserRole === 'owner'

  // ── General settings form state ──
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description ?? '')
  const [goal, setGoal] = useState(group.goal ?? '')
  const [privacy, setPrivacy] = useState<'public' | 'private'>(
    group.privacy as 'public' | 'private'
  )

  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)
  const [isSaving, startSaving] = useTransition()

  // ── Invite token state ──
  const [inviteToken, setInviteToken] = useState(group.inviteToken)
  const [copied, setCopied] = useState(false)
  const [isRegenerating, startRegenerating] = useTransition()

  // ── Danger zone state ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [isDeleting, startDeleting] = useTransition()
  const [isLeaving, startLeaving] = useTransition()

  // Refs to capture nav targets after transitions
  const deleteNavRef = useRef(false)
  const leaveNavRef = useRef(false)

  useEffect(() => {
    if (!isDeleting && deleteNavRef.current) {
      deleteNavRef.current = false
      router.push('/study-groups')
    }
  }, [isDeleting, router])

  useEffect(() => {
    if (!isLeaving && leaveNavRef.current) {
      leaveNavRef.current = false
      router.push('/study-groups')
    }
  }, [isLeaving, router])

  const inviteUrl =
    inviteToken && typeof window !== 'undefined'
      ? `${window.location.origin}/study-groups/join/${inviteToken}`
      : null

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setSaveError('Name is required'); return }
    setSaveError('')
    startSaving(async () => {
      try {
        await updateStudyGroup(group.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          goal: goal.trim() || undefined,
          privacy,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save changes')
      }
    })
  }

  function copyInvite() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleRegenerate() {
    if (!confirm('Regenerate invite link? The old link will stop working.')) return
    startRegenerating(async () => {
      const { token } = await regenerateInviteToken(group.id)
      setInviteToken(token)
    })
  }

  function handleDelete() {
    if (deleteInput !== group.name) return
    startDeleting(async () => {
      await deleteStudyGroup(group.id)
      deleteNavRef.current = true
    })
  }

  function handleLeave() {
    if (!confirm('Leave this group? You will lose admin access.')) return
    startLeaving(async () => {
      await leaveStudyGroup(group.id)
      leaveNavRef.current = true
    })
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <h2 className="section-title">Settings</h2>

      {/* ── General settings ─────────────────────────────────────────────── */}
      <section className="dashboard-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">General</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Group name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 resize-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Group goal</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              placeholder="e.g. Pass EUEE with 90%+ in Physics"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 resize-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">Privacy</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'public', icon: Globe, label: 'Public', desc: 'Anyone can join' },
                { value: 'private', icon: Lock, label: 'Private', desc: 'Invite link only' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPrivacy(opt.value as 'public' | 'private')}
                  className={`flex items-start gap-2 rounded-xl border-2 p-3 text-left transition ${
                    privacy === opt.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-200'
                  }`}
                >
                  <opt.icon size={15} className={privacy === opt.value ? 'text-emerald-600' : 'text-slate-400'} />
                  <div>
                    <div className={`text-xs font-semibold ${privacy === opt.value ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-slate-500">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {saveError && <p className="text-xs text-red-600">{saveError}</p>}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {saved ? <Check size={15} /> : <Save size={15} />}
            {isSaving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </form>
      </section>

      {/* ── Invite link ──────────────────────────────────────────────────── */}
      <section className="dashboard-card p-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-800">Invite Link</h3>
        <p className="mb-4 text-xs text-slate-500">
          Share this link so others can join the group directly.
        </p>

        {inviteUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{inviteUrl}</span>
              <button
                onClick={copyInvite}
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 transition hover:text-emerald-600"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-700 disabled:opacity-50"
            >
              <RefreshCw size={12} />
              {isRegenerating ? 'Regenerating…' : 'Regenerate link'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Switch privacy to Private to generate an invite link.
          </p>
        )}
      </section>

      {/* ── Danger zone ──────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-red-200 p-5">
        <h3 className="mb-1 text-sm font-semibold text-red-700">Danger Zone</h3>
        <p className="mb-4 text-xs text-red-500">These actions are irreversible.</p>

        <div className="space-y-3">
          {/* Leave group — for admins who are not the owner */}
          {!isOwner && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-800">Leave group</div>
                <div className="text-xs text-slate-500">You will lose admin access.</div>
              </div>
              <button
                onClick={handleLeave}
                disabled={isLeaving}
                className="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                {isLeaving ? 'Leaving…' : 'Leave'}
              </button>
            </div>
          )}

          {/* Delete group — owner only */}
          {isOwner && (
            <div>
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-800">Delete group</div>
                  <div className="text-xs text-slate-500">
                    Permanently removes the group and all its data.
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm((v) => !v)}
                  className="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Delete
                </button>
              </div>

              {showDeleteConfirm && (
                <div className="rounded-xl bg-red-50 p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-red-700">
                    <AlertTriangle size={14} />
                    Type <span className="rounded bg-red-100 px-1 font-mono">{group.name}</span> to confirm
                  </div>
                  <input
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder={group.name}
                    className="mb-3 h-9 w-full rounded-xl border border-red-200 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  />
                  <button
                    onClick={handleDelete}
                    disabled={deleteInput !== group.name || isDeleting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    {isDeleting ? 'Deleting…' : 'Delete Group Permanently'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
