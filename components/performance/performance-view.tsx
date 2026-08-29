'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  Atom,
  BookOpen,
  Calculator,
  ChevronDown,
  FlaskConical,
  LayoutDashboard,
  Leaf,
  LineChart,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DailyPoint = { date: string; accuracy: number; total: number }
export type SubjectPerf = {
  subjectId: number
  subjectName: string
  subjectSlug: string
  subjectIcon: string
  total: number
  correct: number
  accuracy: number | null
}
export type TopicStat = {
  topicId: number
  topicName: string
  subjectName: string
  total: number
  correct: number
  accuracy: number
}
export type OverallStats = {
  totalAnswered: number
  totalCorrect: number
  accuracy: number
}

type Range = 7 | 30 | 90

interface Props {
  stats: OverallStats
  subjectPerf: SubjectPerf[]
  topicStats: TopicStat[]
  chartData7: DailyPoint[]
  chartData30: DailyPoint[]
  chartData90: DailyPoint[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Calculator,
  Atom,
  FlaskConical,
  Leaf,
  BookOpen,
}

const RANGE_LABELS: Record<Range, string> = {
  7: 'Last 7 days',
  30: 'Last 30 days',
  90: 'Last 90 days',
}

// ─── Accuracy mini-chart ─────────────────────────────────────────────────────

function AccuracyChart({ data }: { data: DailyPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-sm text-slate-400">
        No data for this period
      </div>
    )
  }

  const W = 400
  const H = 100
  const pad = 6

  const maxAcc = 100
  const minAcc = 0

  // Map date → x, accuracy → y
  const xs = data.map((_, i) => pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2))
  const ys = data.map((d) => H - pad - ((d.accuracy - minAcc) / (maxAcc - minAcc)) * (H - pad * 2))

  const polyline = xs.map((x, i) => `${x},${ys[i]}`).join(' ')
  const area =
    `M ${xs[0]},${H} ` +
    xs.map((x, i) => `L ${x},${ys[i]}`).join(' ') +
    ` L ${xs[xs.length - 1]},${H} Z`

  // Axis labels — show first, middle, last date
  const labelIdxs = [0, Math.floor(data.length / 2), data.length - 1].filter(
    (v, i, a) => a.indexOf(v) === i
  )

  return (
    <div className="relative h-[180px] pl-9">
      {/* Y-axis labels */}
      <div className="absolute inset-y-0 left-0 flex flex-col justify-between py-1 text-[10px] text-slate-400">
        <span>100%</span>
        <span>75%</span>
        <span>50%</span>
        <span>25%</span>
        <span>0%</span>
      </div>
      <div className="relative h-[160px] overflow-hidden">
        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(#e9eef0 1px, transparent 1px)',
            backgroundSize: '100% 25%',
          }}
        />
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
        >
          {/* Area fill */}
          <path d={area} fill="#10b981" fillOpacity="0.08" />
          {/* Line */}
          <polyline
            points={polyline}
            fill="none"
            stroke="#059669"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dots for each data point */}
          {xs.map((x, i) => (
            <circle
              key={i}
              cx={x}
              cy={ys[i]}
              r="3"
              fill="#059669"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      {/* X-axis date labels */}
      <div className="relative mt-1 flex justify-between text-[10px] text-slate-400">
        {labelIdxs.map((idx) => (
          <span key={idx}>
            {new Date(data[idx].date + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Subject bar ─────────────────────────────────────────────────────────────

function SubjectBar({ s }: { s: SubjectPerf }) {
  const Icon = ICON_MAP[s.subjectIcon] ?? BookOpen
  const notStarted = s.accuracy === null

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Icon size={16} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-800">{s.subjectName}</span>
          {notStarted ? (
            <span className="text-xs text-slate-400">Not started</span>
          ) : (
            <span className="font-semibold text-emerald-700">{s.accuracy}%</span>
          )}
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${s.accuracy ?? 0}%` }}
          />
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          {notStarted ? '0 attempted' : `${s.correct} correct / ${s.total} attempted`}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PerformanceView({
  stats,
  subjectPerf,
  topicStats,
  chartData7,
  chartData30,
  chartData90,
}: Props) {
  const [range, setRange] = useState<Range>(30)
  const [rangeOpen, setRangeOpen] = useState(false)

  const chartDataMap: Record<Range, DailyPoint[]> = {
    7: chartData7,
    30: chartData30,
    90: chartData90,
  }
  const activeData = chartDataMap[range]

  const weakAreas = topicStats.slice(0, 5) // bottom 5 accuracy topics

  const noData = stats.totalAnswered === 0

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-700"
      >
        <LayoutDashboard size={13} />
        Dashboard
      </Link>

      {/* Page header */}
      <div className="mb-7">
        <h1 className="section-title flex items-center gap-2">
          <LineChart size={20} className="text-emerald-600" />
          Performance
        </h1>
        <p className="mt-1 text-sm text-slate-500">Your real progress from actual practice sessions</p>
      </div>

      {noData ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <Activity size={28} className="text-emerald-600" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">No data yet</h2>
          <p className="mb-8 max-w-sm text-sm leading-relaxed text-slate-500">
            Complete some practice questions and your performance statistics will appear here.
          </p>
          <Link
            href="/exams"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <BookOpen size={15} />
            Browse Exams
          </Link>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Overall stats ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Questions Answered', value: stats.totalAnswered, icon: Target },
              { label: 'Correct', value: stats.totalCorrect, icon: TrendingUp },
              {
                label: 'Incorrect',
                value: stats.totalAnswered - stats.totalCorrect,
                icon: TrendingDown,
              },
              { label: 'Overall Accuracy', value: `${stats.accuracy}%`, icon: Zap },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="dashboard-card p-4">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Icon size={16} />
                </div>
                <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
                <div className="mt-0.5 text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Accuracy over time chart ── */}
          <div className="dashboard-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title">Accuracy Over Time</h2>
              <div className="relative">
                <button
                  onClick={() => setRangeOpen((v) => !v)}
                  className="filter-button"
                >
                  {RANGE_LABELS[range]}
                  <ChevronDown size={13} />
                </button>
                {rangeOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {([7, 30, 90] as Range[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => { setRange(r); setRangeOpen(false) }}
                        className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-emerald-50 ${
                          range === r ? 'font-semibold text-emerald-700' : 'text-slate-700'
                        }`}
                      >
                        {RANGE_LABELS[r]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <AccuracyChart data={activeData} />
          </div>

          {/* ── Subject performance ── */}
          <div className="dashboard-card p-5">
            <h2 className="section-title mb-5">Subject Performance</h2>
            {subjectPerf.length === 0 ? (
              <p className="text-sm text-slate-400">No subject data available.</p>
            ) : (
              <div className="space-y-4">
                {subjectPerf.map((s) => (
                  <SubjectBar key={s.subjectId} s={s} />
                ))}
              </div>
            )}
          </div>

          {/* ── Weak areas ── */}
          <div className="dashboard-card p-5">
            <h2 className="section-title mb-1">Weak Areas</h2>
            <p className="mb-5 text-xs text-slate-500">
              Topics where you answered at least 3 questions
            </p>
            {weakAreas.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm text-slate-500">
                  Complete more questions to discover your weak areas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {weakAreas.map((t) => (
                  <div key={t.topicId} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-800">{t.topicName}</div>
                      <div className="text-[11px] text-slate-400">
                        {t.subjectName} · {t.total} attempted
                      </div>
                    </div>
                    <div
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        t.accuracy < 50
                          ? 'bg-red-100 text-red-700'
                          : t.accuracy < 65
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {t.accuracy}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
