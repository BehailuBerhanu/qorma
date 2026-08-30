'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, UserMinus, UserCheck } from 'lucide-react'
import { changeMemberRole, removeMember } from '@/lib/actions/study-groups'

interface Member {
  userId: string
  name: string
  email: string
  role: string
  joinedAt: Date
  totalAnswered: number
  accuracy: number
}

interface Props {
  groupId: number
  currentUserId: string
  members: Member[]
  currentUserRole: string
}

const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-emerald-100 text-emerald-800',
  admin: 'bg-blue-100 text-blue-800',
  member: 'bg-slate-100 text-slate-600',
}

export default function GroupMembers({ groupId, currentUserId, members, currentUserRole }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()

  const isOwner = currentUserRole === 'owner'
  const isAdminOrOwner = isOwner || currentUserRole === 'admin'

  function promote(userId: string, role: 'admin' | 'member') {
    start(async () => {
      await changeMemberRole(groupId, userId, role)
      router.refresh()
    })
  }

  function remove(userId: string) {
    if (!confirm('Remove this member from the group?')) return
    start(async () => {
      await removeMember(groupId, userId)
      router.refresh()
    })
  }

  return (
    <div>
      <h2 className="section-title mb-4">
        Members <span className="text-sm font-normal text-slate-500">({members.length})</span>
      </h2>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
          No members yet.
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.userId} className="dashboard-card flex items-center gap-3 px-4 py-3">
              {/* Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                {m.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">
                    {m.name}
                    {m.userId === currentUserId && (
                      <span className="ml-1 text-xs text-slate-400">(you)</span>
                    )}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${ROLE_BADGE[m.role] ?? ROLE_BADGE.member}`}>
                    {m.role}
                  </span>
                </div>
                <div className="mt-0.5 flex gap-3 text-[11px] text-slate-500">
                  <span>{m.totalAnswered} questions solved</span>
                  {m.totalAnswered > 0 && <span>{m.accuracy}% accuracy</span>}
                  <span>
                    Joined {new Date(m.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Actions (only for admins/owners, not self, not owner target) */}
              {isAdminOrOwner && m.userId !== currentUserId && m.role !== 'owner' && (
                <div className="flex items-center gap-1">
                  {isOwner && (
                    <button
                      onClick={() => promote(m.userId, m.role === 'admin' ? 'member' : 'admin')}
                      disabled={pending}
                      title={m.role === 'admin' ? 'Remove admin' : 'Make admin'}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-blue-50 disabled:opacity-40 ${
                        m.role === 'admin' ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    >
                      {m.role === 'admin' ? <UserCheck size={14} /> : <Shield size={14} />}
                    </button>
                  )}
                  <button
                    onClick={() => remove(m.userId)}
                    disabled={pending}
                    title="Remove member"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                  >
                    <UserMinus size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
