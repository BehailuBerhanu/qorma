'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/auth-client'
import {
  Activity,
  Atom,
  Award,
  Bell,
  BookOpen,
  Bookmark,
  Calculator,
  ChevronDown,
  ChevronRight,
  Download,
  FlaskConical,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Leaf,
  LineChart,
  Menu,
  MessageCircle,
  PenLine,
  Search,
  Settings,
  Sparkles,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react'

// ─── Types from server ───────────────────────────────────────────────────────

interface UserStats {
  totalAnswered: number
  totalCorrect: number
  accuracy: number
}

interface SubjectStat {
  subjectId: number
  subjectName: string
  subjectSlug: string
  subjectIcon: string
  total: number
  correct: number
  accuracy: number
}

interface ActivityItem {
  answeredAt: Date
  isCorrect: boolean
  questionBody: string
  subjectName: string
  examLabel: string
}

interface SubjectRow {
  id: number
  slug: string
  name: string
  iconName: string
  sortOrder: number
}

interface Props {
  user: { name: string; email: string }
  stats: UserStats
  subjectStats: SubjectStat[]
  recentActivity: ActivityItem[]
  streak: number
  allSubjects: SubjectRow[]
  chartData: Array<{ date: string; accuracy: number; total: number }>
}

// ─── Constants ───────────────────────────────────────────────────────────────

const logoUrl =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-XcAT3KJCbYcAEdEgc47thD1Sb5EpLZ.png'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Calculator,
  Atom,
  FlaskConical,
  Leaf,
  BookOpen,
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Practice', icon: PenLine, href: '/exams' },
  { label: 'Past Exams', icon: BookOpen, href: '/exams' },
  { label: 'Bookmarks', icon: Bookmark, href: '/bookmarks' },
  { label: 'Performance', icon: LineChart, href: '/performance' },
  { label: 'Challenges', icon: Trophy, href: '#' },
  { label: 'Study Groups', icon: Users, href: '/study-groups' },
  { label: 'Downloads', icon: Download, href: '#' },
  { label: 'Settings', icon: Settings, href: '#' },
]

const leaderboard = [
  ['1', 'Bereket', '2,450 XP', '🥇'],
  ['2', 'Dawit (You)', '1,980 XP', '🥈'],
  ['3', 'Samuel', '1,750 XP', '🥉'],
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ value, light = false }: { value: number; light?: boolean }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full ${light ? 'bg-emerald-100/30' : 'bg-slate-100'}`}>
      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${value}%` }} />
    </div>
  )
}

function CrownIcon() {
  return <span aria-hidden="true" className="text-lg">♛</span>
}

function Sidebar({
  active,
  setActive,
  userName,
  userEmail,
  onSignOut,
}: {
  active: string
  setActive: (label: string) => void
  userName: string
  userEmail: string
  onSignOut: () => void
}) {
  return (
    <aside className="hidden w-[248px] shrink-0 flex-col bg-[#03251d] px-4 py-6 text-white lg:flex">
      <div className="mb-10 flex items-center gap-3 px-3">
        <img src={logoUrl} alt="Qorma" className="h-12 w-12 object-contain object-left" />
        <div>
          <div className="text-[23px] font-semibold tracking-[0.16em]">QORMA</div>
          <div className="text-[10px] text-emerald-100">Master Every Question</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1" aria-label="Primary navigation">
        {navItems.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            onClick={() => setActive(label)}
            className={`flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left text-[15px] transition ${
              active === label
                ? 'bg-emerald-600 font-medium shadow-lg shadow-emerald-950/30'
                : 'text-emerald-50/90 hover:bg-emerald-900/60'
            }`}
          >
            <Icon size={20} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="rounded-2xl bg-emerald-900/80 p-4">
        <div className="flex items-center gap-2 font-semibold">
          <CrownIcon /> Go Premium
        </div>
        <p className="mt-2 text-xs leading-5 text-emerald-50/80">
          Unlock unlimited practice, AI explanations, and more.
        </p>
        <button className="mt-4 w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400">
          Upgrade Now
        </button>
      </div>
      <div className="mt-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-lg">
          {userName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium">Hi, {userName.split(' ')[0]}</div>
          <div className="truncate text-xs text-emerald-100/70">{userEmail}</div>
        </div>
        <button
          onClick={onSignOut}
          className="ml-auto text-xs text-emerald-100/70 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  note,
  accent = false,
}: {
  icon: typeof Flame
  label: string
  value: string
  note: string
  accent?: boolean
}) {
  return (
    <div className="dashboard-card flex min-h-[126px] flex-col justify-between p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            accent ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          <Icon size={21} />
        </div>
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
      <div>
        <div className="text-[27px] font-semibold tracking-tight text-slate-900">{value}</div>
        <div className="text-xs text-emerald-600">{note}</div>
      </div>
    </div>
  )
}

function PerformanceChart({ data }: { data: Array<{ date: string; accuracy: number; total: number }> }) {
  // Fall back to a flat line when there's no real data yet
  const hasData = data.length > 0

  const W = 270
  const H = 100
  const pad = 4

  const points = hasData
    ? data
        .map((d, i) => {
          const x = pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2)
          const y = H - pad - (d.accuracy / 100) * (H - pad * 2)
          return `${x},${y}`
        })
        .join(' ')
    : `${pad},${H / 2} ${W - pad},${H / 2}` // flat line placeholder

  const dots = hasData
    ? data.map((d, i) => ({
        cx: pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2),
        cy: H - pad - (d.accuracy / 100) * (H - pad * 2),
      }))
    : []

  return (
    <div className="dashboard-card p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="section-title">Performance Overview</h2>
        <Link href="/performance" className="filter-button">
          View Details
        </Link>
      </div>
      <div className="relative h-[160px] pl-8">
        <div className="absolute inset-x-8 top-1 bottom-5 flex flex-col justify-between text-[10px] text-slate-400">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>
        <div
          className="absolute inset-x-8 top-1 bottom-5 overflow-hidden"
          style={{
            backgroundImage:
              'linear-gradient(#e9eef0 1px, transparent 1px), linear-gradient(90deg, #e9eef0 1px, transparent 1px)',
            backgroundSize: '25% 25%',
          }}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
          >
            <polyline
              points={points}
              fill="none"
              stroke={hasData ? '#0b9252' : '#cbd5e1'}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeDasharray={hasData ? undefined : '4 3'}
            />
            {dots.map((pt, i) => (
              <circle
                key={i}
                cx={pt.cx}
                cy={pt.cy}
                r="2.5"
                fill="#0b9252"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>
        {hasData ? (
          <div className="absolute inset-x-8 bottom-0 flex justify-between text-[10px] text-slate-500">
            <span>
              {new Date(data[0].date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {data.length > 2 && (
              <span>
                {new Date(data[Math.floor(data.length / 2)].date + 'T00:00:00').toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric' }
                )}
              </span>
            )}
            <span>
              {new Date(data[data.length - 1].date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        ) : (
          <div className="absolute inset-x-8 bottom-0 text-center text-[10px] text-slate-400">
            Practice questions to see your progress
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function QormaDashboard({
  user,
  stats,
  subjectStats,
  recentActivity,
  streak,
  allSubjects,
  chartData,
}: Props) {
  const router = useRouter()
  const [active, setActive] = useState('Dashboard')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/sign-in')
    router.refresh()
  }

  const feedback = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2200)
  }

  // Build subject display list — use real stats if available, fall back to subjects list
  const displaySubjects = useMemo(() => {
    if (subjectStats.length > 0) {
      return subjectStats
        .filter((s) => s.subjectName.toLowerCase().includes(query.toLowerCase()))
        .map((s) => ({
          id: s.subjectId,
          name: s.subjectName,
          slug: s.subjectSlug,
          iconName: s.subjectIcon,
          score: s.accuracy,
          done: `${s.correct} / ${s.total}`,
        }))
    }
    // No activity yet — show subjects that have data with 0%
    return allSubjects
      .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
      .map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        iconName: s.iconName,
        score: 0,
        done: 'Not started',
      }))
  }, [subjectStats, allSubjects, query])

  // Date greeting
  const now = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Format stats
  const totalAnsweredDisplay =
    stats.totalAnswered >= 1000
      ? `${(stats.totalAnswered / 1000).toFixed(1)}k`
      : String(stats.totalAnswered)

  return (
    <div className="flex min-h-screen bg-[#f8faf9] text-slate-900">
      <Sidebar
        active={active}
        setActive={setActive}
        userName={user.name}
        userEmail={user.email}
        onSignOut={handleSignOut}
      />

      <div className="min-w-0 flex-1">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur lg:px-8">
          <button
            className="mr-3 lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
          <label className="relative hidden w-full max-w-[505px] sm:block">
            <Search size={18} className="absolute left-4 top-3 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions, topics or exams..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
            <span className="absolute right-3 top-2 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">
              ⌘ K
            </span>
          </label>
          <div className="flex items-center gap-5">
            <span className="hidden text-sm font-medium sm:inline">
              <span className="mr-1 text-orange-500">♨</span>
              {streak} day streak
            </span>
            <button
              aria-label="Notifications"
              onClick={() => feedback('No new notifications')}
              className="relative"
            >
              <Bell size={20} />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-xs text-emerald-100">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="absolute left-0 right-0 top-[68px] z-30 border-b bg-white p-4 shadow-lg lg:hidden">
            <nav className="grid grid-cols-2 gap-2">
              {navItems.slice(0, 8).map(({ label, icon: Icon, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => { setActive(label); setMenuOpen(false) }}
                  className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                    active === label ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-50'
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        <main className="mx-auto max-w-[1440px] px-5 py-7 lg:px-8">
          {/* Page header */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm text-slate-500">{dateString}</p>
              <h1 className="text-balance text-[26px] font-semibold tracking-tight">
                {greeting}, {user.name.split(' ')[0]}! <span className="text-xl">👋</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500">Ready to master your goals today?</p>
            </div>
            <Link
              href="/exams"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <BookOpen size={16} />
              Browse Past Exams
            </Link>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,2.1fr)_358px]">
            <div className="space-y-7">
              {/* Stat cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={GraduationCap}
                  label="Questions Solved"
                  value={totalAnsweredDisplay || '0'}
                  note={stats.totalAnswered > 0 ? 'Keep going! ↗' : 'Start practicing →'}
                />
                <StatCard
                  icon={Zap}
                  label="Accuracy"
                  value={`${stats.accuracy}%`}
                  note={stats.totalAnswered > 0 ? 'Overall score' : 'No data yet'}
                />
                <StatCard
                  icon={Flame}
                  label="Current Streak"
                  value={String(streak)}
                  note={streak > 0 ? 'Keep it up! ♨' : 'Start a streak today'}
                  accent
                />
                <StatCard
                  icon={Award}
                  label="Total Correct"
                  value={String(stats.totalCorrect)}
                  note={stats.totalAnswered > 0 ? `of ${stats.totalAnswered} answered` : 'No answers yet'}
                />
              </div>

              {/* Subjects */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="section-title">Your Subjects</h2>
                  <Link
                    href="/exams"
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
                  >
                    Practice Now
                  </Link>
                </div>
                {displaySubjects.length === 0 && query ? (
                  <p className="text-sm text-slate-500">No subjects match your search.</p>
                ) : displaySubjects.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                    <p className="text-sm text-slate-500">
                      No practice data yet.{' '}
                      <Link href="/exams" className="text-emerald-700 underline">
                        Start your first session
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {displaySubjects.map(({ id, name, slug, iconName, score, done }) => {
                      const Icon = ICON_MAP[iconName] ?? BookOpen
                      return (
                        <Link
                          key={id}
                          href={`/exams?subject=${slug}`}
                          className="dashboard-card block p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <Icon size={27} strokeWidth={1.6} />
                          </div>
                          <div className="font-medium">{name}</div>
                          <div className="mt-3 flex items-center justify-between text-sm font-semibold text-emerald-700">
                            <span>{score}%</span>
                          </div>
                          <ProgressBar value={score} />
                          <div className="mt-2 text-right text-[11px] text-slate-500">{done}</div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Continue Learning CTA */}
              <section>
                <h2 className="section-title mb-4">Continue Learning</h2>
                <div className="dashboard-card overflow-hidden sm:flex">
                  <div className="relative min-h-[145px] flex-1 overflow-hidden bg-[#087e60] p-6 text-white">
                    <div className="relative z-10">
                      <div className="max-w-[180px] text-lg font-semibold leading-tight">
                        Browse EUEE<br />Past Exams
                      </div>
                      <div className="mt-5 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs">
                        All Subjects
                      </div>
                    </div>
                    <div className="absolute right-5 top-5 text-emerald-100/40">
                      <svg width="150" height="110" viewBox="0 0 150 110" fill="none">
                        <path d="M8 88 Q75 10 142 88" stroke="currentColor" />
                        <path d="M74 10v94M10 76h130" stroke="currentColor" strokeDasharray="3 4" />
                        <path d="M38 75l35-16 30 10" stroke="currentColor" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-[1.55] flex-col justify-center p-6">
                    <div className="font-semibold">EUEE Past Exam Practice</div>
                    <div className="mt-2 text-xs text-slate-600">
                      Years 2005–2016 available. Select a subject and start practicing.
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link
                        href="/exams"
                        className="rounded-lg bg-emerald-600 px-7 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Browse Exams
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recent Activity */}
              <section>
                <h2 className="section-title mb-4">Recent Activity</h2>
                <div className="dashboard-card divide-y divide-slate-100">
                  {recentActivity.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      No activity yet.{' '}
                      <Link href="/exams" className="text-emerald-700 underline">
                        Practice your first question
                      </Link>
                    </div>
                  ) : (
                    recentActivity.map((item, i) => (
                      <div
                        key={i}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm"
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${
                            item.isCorrect ? 'bg-emerald-600' : 'bg-red-500'
                          }`}
                        >
                          {item.isCorrect ? '✓' : '×'}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block truncate font-medium">{item.subjectName} — {item.examLabel}</span>
                          <span className="block truncate text-xs text-slate-500">{item.questionBody}</span>
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {new Date(item.answeredAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                  {recentActivity.length > 0 && (
                    <Link
                      href="/exams"
                      className="flex w-full items-center justify-center py-4 text-sm font-medium text-emerald-700 hover:bg-slate-50"
                    >
                      Practice More
                    </Link>
                  )}
                </div>
              </section>
            </div>

            {/* Right sidebar */}
            <aside className="space-y-5">
              {/* Streak widget */}
              <div className="dashboard-card p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="section-title">
                    <span className="mr-2">♨</span>Daily Streak
                  </h2>
                  <strong className="text-emerald-600">{streak} days</strong>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-600">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                    const active = i < Math.min(streak, 7)
                    return (
                      <div key={day}>
                        <div>{day}</div>
                        <div
                          className={`mx-auto mt-3 flex h-6 w-6 items-center justify-center rounded-full ${
                            active
                              ? 'bg-emerald-600 text-white'
                              : 'border-2 border-slate-200 text-transparent'
                          }`}
                        >
                          {active ? '✓' : '_'}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-5 rounded-lg bg-emerald-50 py-3 text-center text-sm font-medium">
                  {streak >= 7
                    ? 'Amazing! You\'re on fire!'
                    : streak > 0
                    ? `${streak} day streak — keep going!`
                    : 'Practice today to start a streak!'}
                </div>
              </div>

              <PerformanceChart data={chartData} />

              {/* Leaderboard */}
              <div className="dashboard-card overflow-hidden">
                <div className="flex items-center justify-between p-5">
                  <h2 className="section-title">Leaderboard</h2>
                  <button className="filter-button">
                    This Week <ChevronDown size={14} />
                  </button>
                </div>
                {leaderboard.map(([rank, name, xp, medal]) => (
                  <div
                    key={rank}
                    className={`flex items-center gap-3 px-5 py-3 ${
                      rank === '2' ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <span className="w-3 text-sm text-slate-500">{rank}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-[10px] text-white">
                      {name === 'Dawit (You)'
                        ? user.name.slice(0, 2).toUpperCase()
                        : name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium">{name}</span>
                    <span className="text-sm">{xp}</span>
                    <span>{medal}</span>
                  </div>
                ))}
                <button
                  onClick={() => feedback('Full leaderboard coming soon!')}
                  className="w-full border-t border-slate-100 py-4 text-sm font-medium text-emerald-700"
                >
                  View Full Leaderboard
                </button>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* Toast notification */}
      {notice && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#03251d] px-5 py-3 text-sm text-white shadow-xl lg:bottom-6"
        >
          {notice}
        </div>
      )}

      {/* Mobile bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-slate-200 bg-white p-2 lg:hidden">
        {navItems.slice(0, 5).map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            onClick={() => setActive(label)}
            className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] ${
              active === label ? 'text-emerald-700' : 'text-slate-500'
            }`}
          >
            <Icon size={19} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
