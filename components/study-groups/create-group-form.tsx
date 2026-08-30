'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { createStudyGroup } from '@/lib/actions/study-groups'

interface Props {
  subjects: Array<{ id: number; name: string; slug: string }>
  exams: Array<{ id: number; label: string; year: number; examType: string }>
}

export default function CreateGroupForm({ subjects, exams }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [examId, setExamId] = useState<number | ''>('')
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([])
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public')
  const [goal, setGoal] = useState('')

  function toggleSubject(id: number) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Group name is required'); return }
    setError('')
    setIsPending(true)
    try {
      const { groupId } = await createStudyGroup({
        name,
        description,
        examId: examId ? Number(examId) : undefined,
        subjectIds: selectedSubjects,
        privacy,
        goal,
      })
      router.push(`/study-groups/${groupId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setIsPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-8 lg:px-8">
      {/* Back */}
      <Link
        href="/study-groups"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
      >
        <ArrowLeft size={14} />
        Study Groups
      </Link>

      <h1 className="section-title mb-1 text-[22px]">Create a Study Group</h1>
      <p className="mb-7 text-sm text-slate-500">
        Bring students together around a shared exam goal.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Group name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grade 12 Natural Science — EUEE 2027"
            maxLength={150}
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe who this group is for and what you'll study together."
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        {/* Exam */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Exam</label>
          <select
            value={examId}
            onChange={(e) => setExamId(e.target.value ? Number(e.target.value) : '')}
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">Select an exam (optional)</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subjects */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Subjects</label>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSubject(s.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  selectedSubjects.includes(s.id)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                }`}
              >
                {selectedSubjects.includes(s.id) && <Check size={11} />}
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Privacy</label>
          <div className="grid grid-cols-2 gap-3">
            {(['public', 'private'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrivacy(p)}
                className={`rounded-xl border p-3 text-left transition ${
                  privacy === p
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-emerald-200'
                }`}
              >
                <div className="text-sm font-semibold capitalize text-slate-800">{p}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {p === 'public'
                    ? 'Anyone can discover and join'
                    : 'Only via invite link'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Goal (optional) */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Group goal <span className="text-xs text-slate-400">(optional)</span>
          </label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Complete 500 questions together before the exam."
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? 'Creating…' : 'Create Study Group'}
        </button>
      </form>
    </div>
  )
}
