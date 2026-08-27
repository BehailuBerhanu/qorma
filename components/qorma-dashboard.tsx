'use client'

import { useMemo, useState } from 'react'
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
  CircleHelp,
  Download,
  FlaskConical,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Leaf,
  LineChart,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PenLine,
  Search,
  Settings,
  Sparkles,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react'

const logoUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-XcAT3KJCbYcAEdEgc47thD1Sb5EpLZ.png'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Practice', icon: PenLine },
  { label: 'Past Exams', icon: BookOpen },
  { label: 'AI Tutor', icon: Sparkles },
  { label: 'Subjects', icon: BookOpen },
  { label: 'Bookmarks', icon: Bookmark },
  { label: 'Performance', icon: LineChart },
  { label: 'Challenges', icon: Trophy },
  { label: 'Study Groups', icon: Users },
  { label: 'Downloads', icon: Download },
  { label: 'Settings', icon: Settings },
]

const subjects = [
  { name: 'Mathematics', score: 78, done: '342 / 438', icon: Calculator },
  { name: 'Physics', score: 64, done: '256 / 400', icon: Atom },
  { name: 'Chemistry', score: 82, done: '299 / 365', icon: FlaskConical },
  { name: 'Biology', score: 71, done: '220 / 310', icon: Leaf },
  { name: 'English', score: 68, done: '180 / 265', icon: BookOpen },
]

const activity = [
  ['Solved 10 questions in Mathematics', '2h ago', true],
  ['Incorrect answer in Physics – Mechanics', '4h ago', false],
  ['Completed Chemistry – Stoichiometry set', '6h ago', true],
]

const leaderboard = [
  ['1', 'Berekет', '2,450 XP', '🥇'],
  ['2', 'Dawit (You)', '1,980 XP', '🥈'],
  ['3', 'Samuel', '1,750 XP', '🥉'],
]

function ProgressBar({ value, light = false }: { value: number; light?: boolean }) {
  return <div className={`h-1.5 overflow-hidden rounded-full ${light ? 'bg-emerald-100/30' : 'bg-slate-100'}`}><div className="h-full rounded-full bg-emerald-600" style={{ width: `${value}%` }} /></div>
}

function Sidebar({ active, setActive }: { active: string; setActive: (label: string) => void }) {
  return (
    <aside className="hidden w-[248px] shrink-0 flex-col bg-[#03251d] px-4 py-6 text-white lg:flex">
      <div className="mb-10 flex items-center gap-3 px-3">
        <img src={logoUrl} alt="Qorma" className="h-12 w-12 object-contain object-left" />
        <div><div className="text-[23px] font-semibold tracking-[0.16em]">QORMA</div><div className="text-[10px] text-emerald-100">Master Every Question</div></div>
      </div>
      <nav className="flex-1 space-y-1" aria-label="Primary navigation">
        {navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => setActive(label)} className={`flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left text-[15px] transition ${active === label ? 'bg-emerald-600 font-medium shadow-lg shadow-emerald-950/30' : 'text-emerald-50/90 hover:bg-emerald-900/60'}`}><Icon size={20} strokeWidth={1.8} />{label}</button>)}
      </nav>
      <div className="rounded-2xl bg-emerald-900/80 p-4"><div className="flex items-center gap-2 font-semibold"><CrownIcon /> Go Premium</div><p className="mt-2 text-xs leading-5 text-emerald-50/80">Unlock unlimited practice, AI explanations, and more.</p><button className="mt-4 w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400">Upgrade Now</button></div>
      <div className="mt-8 flex items-center gap-3 px-2"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-lg">DW</div><div className="min-w-0"><div className="text-sm font-medium">Hi, Dawit</div><div className="truncate text-xs text-emerald-100/70">Grade 12 · Natural Science</div></div><ChevronDown size={15} className="ml-auto" /></div>
    </aside>
  )
}

function CrownIcon() { return <span aria-hidden="true" className="text-lg">♛</span> }

function StatCard({ icon: Icon, label, value, note, accent = false }: { icon: typeof Flame; label: string; value: string; note: string; accent?: boolean }) {
  return <div className="dashboard-card flex min-h-[126px] flex-col justify-between p-5"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-full ${accent ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-50 text-emerald-600'}`}><Icon size={21} /></div><span className="text-xs font-medium text-slate-600">{label}</span></div><div><div className="text-[27px] font-semibold tracking-tight text-slate-900">{value}</div><div className="text-xs text-emerald-600">{note}</div></div></div>
}

function PerformanceChart() {
  const values = [50, 53, 46, 52, 51, 57, 68, 67, 58, 83, 75, 68, 63, 75, 79, 87]
  const points = values.map((value, i) => `${i * 18},${100 - value}`).join(' ')
  return <div className="dashboard-card p-5"><div className="mb-5 flex items-center justify-between"><h2 className="section-title">Performance Overview</h2><button className="filter-button">This Month <ChevronDown size={14} /></button></div><div className="relative h-[160px] pl-8"><div className="absolute inset-x-8 top-1 bottom-5 flex flex-col justify-between text-[10px] text-slate-400"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="absolute inset-x-8 top-1 bottom-5 overflow-hidden" style={{ backgroundImage: 'linear-gradient(#e9eef0 1px, transparent 1px), linear-gradient(90deg, #e9eef0 1px, transparent 1px)', backgroundSize: '25% 25%' }}><svg viewBox="0 0 270 100" preserveAspectRatio="none" className="h-full w-full overflow-visible"><polyline points={points} fill="none" stroke="#0b9252" strokeWidth="2" vectorEffect="non-scaling-stroke" />{values.map((value, i) => <circle key={i} cx={i * 18} cy={100 - value} r="2.5" fill="#0b9252" vectorEffect="non-scaling-stroke" />)}</svg></div><div className="absolute inset-x-8 bottom-0 flex justify-between text-[10px] text-slate-500"><span>May 1</span><span>May 8</span><span>May 15</span><span>May 22</span><span>May 29</span></div></div><div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3"><div className="flex items-center justify-between text-sm font-medium"><span>Overall Accuracy</span><strong className="text-lg text-emerald-600">76%</strong></div><div className="mt-1 text-xs text-emerald-600">+8% from last month</div></div></div>
}

export default function QormaDashboard() {
  const [active, setActive] = useState('Dashboard')
  const [query, setQuery] = useState('')
  const [grade, setGrade] = useState('Grade 12 (Natural Science)')
  const [notice, setNotice] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const visibleSubjects = useMemo(() => subjects.filter((subject) => subject.name.toLowerCase().includes(query.toLowerCase())), [query])
  const feedback = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2200) }

  return <div className="flex min-h-screen bg-[#f8faf9] text-slate-900"><Sidebar active={active} setActive={setActive} /><div className="min-w-0 flex-1"><header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur lg:px-8"><button className="mr-3 lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button><label className="relative hidden w-full max-w-[505px] sm:block"><Search size={18} className="absolute left-4 top-3 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions, topics or exams..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /><span className="absolute right-3 top-2 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">⌘ K</span></label><div className="flex items-center gap-5"><span className="hidden text-sm font-medium sm:inline"><span className="mr-1 text-orange-500">♨</span>125 day streak</span><button aria-label="Notifications" onClick={() => feedback('No new notifications')} className="relative"><Bell size={20} /><span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">3</span></button><div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-xs text-emerald-100">DW</div></div></header>{menuOpen && <div className="absolute left-0 right-0 top-[68px] z-30 border-b bg-white p-4 shadow-lg lg:hidden"><nav className="grid grid-cols-2 gap-2">{navItems.slice(0, 8).map(({ label, icon: Icon }) => <button key={label} onClick={() => { setActive(label); setMenuOpen(false) }} className={`flex items-center gap-2 rounded-lg p-3 text-sm ${active === label ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-50'}`}><Icon size={17} />{label}</button>)}</nav></div>}
      <main className="mx-auto max-w-[1440px] px-5 py-7 lg:px-8"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm text-slate-500">Wednesday, May 29, 2024</p><h1 className="text-balance text-[26px] font-semibold tracking-tight">Good evening, Dawit! <span className="text-xl">👋</span></h1><p className="mt-1 text-sm text-slate-500">Ready to master your goals today?</p></div><select value={grade} onChange={(e) => setGrade(e.target.value)} className="filter-button h-10 min-w-[218px] appearance-none bg-white"><option>Grade 12 (Natural Science)</option><option>Grade 11 (Natural Science)</option><option>Grade 12 (Social Science)</option></select></div><div className="grid gap-5 xl:grid-cols-[minmax(0,2.1fr)_358px]"><div className="space-y-7"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={GraduationCap} label="Questions Solved" value="1,248" note="+128 this week ↗" /><StatCard icon={Zap} label="Accuracy" value="78%" note="+6% this week ↗" /><StatCard icon={Flame} label="Current Streak" value="125" note="Keep it up! ♨" accent /><StatCard icon={Award} label="Total XP" value="12,560" note="Level 15  •  ▬▬▬" /></div><section><div className="mb-4 flex items-center justify-between"><h2 className="section-title">Your Subjects</h2><button onClick={() => feedback('Showing all subjects')} className="text-sm font-medium text-emerald-700 hover:text-emerald-900">View All</button></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{visibleSubjects.map(({ name, score, done, icon: Icon }) => <div key={name} className="dashboard-card p-4"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon size={27} strokeWidth={1.6} /></div><div className="font-medium">{name}</div><div className="mt-3 flex items-center justify-between text-sm font-semibold text-emerald-700"><span>{score}%</span></div><ProgressBar value={score} /><div className="mt-2 text-right text-[11px] text-slate-500">{done}</div></div>)}</div></section><section><h2 className="section-title mb-4">Continue Learning</h2><div className="dashboard-card overflow-hidden sm:flex"><div className="relative min-h-[145px] flex-1 overflow-hidden bg-[#087e60] p-6 text-white"><div className="relative z-10"><div className="max-w-[180px] text-lg font-semibold leading-tight">Quadratic Equations<br />Practice Set</div><div className="mt-5 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs">Mathematics</div></div><div className="absolute right-5 top-5 text-emerald-100/40"><svg width="150" height="110" viewBox="0 0 150 110" fill="none"><path d="M8 88 Q75 10 142 88" stroke="currentColor" /><path d="M74 10v94M10 76h130" stroke="currentColor" strokeDasharray="3 4" /><path d="M38 75l35-16 30 10" stroke="currentColor" /></svg></div></div><div className="flex flex-[1.55] flex-col justify-center p-6"><div className="font-semibold">Quadratic Equations – Mixed Practice</div><div className="mt-2 text-xs text-slate-600">Question 12 of 20 <span className="float-right text-sm">60%</span></div><div className="mt-2"><ProgressBar value={60} /></div><div className="mt-4 flex gap-2"><button onClick={() => feedback('Practice resumed')} className="rounded-lg bg-emerald-600 px-7 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Continue Practice</button><button aria-label="Open practice" onClick={() => feedback('Practice details opened')} className="rounded-lg border border-slate-200 px-3 text-slate-700 hover:bg-slate-50"><ChevronRight size={18} /></button></div></div></div></section><section><h2 className="section-title mb-4">Recent Activity</h2><div className="dashboard-card divide-y divide-slate-100">{activity.map(([label, time, success]) => <button key={label} onClick={() => feedback(String(label))} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50"><span className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${success ? 'bg-emerald-600' : 'bg-red-500'}`}>{success ? '✓' : '×'}</span><span className="flex-1">{label}</span><span className="text-xs text-slate-500">{time}</span><ChevronRight size={16} className="text-slate-400" /></button>)}<button onClick={() => feedback('All activity opened')} className="w-full py-4 text-sm font-medium text-emerald-700">View All Activity</button></div></section></div><aside className="space-y-5"><div className="dashboard-card p-5"><div className="mb-5 flex items-center justify-between"><h2 className="section-title"><span className="mr-2">♨</span>Daily Streak</h2><strong className="text-emerald-600">125 days</strong></div><div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-600">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => <div key={day}><div>{day}</div><div className={`mx-auto mt-3 flex h-6 w-6 items-center justify-center rounded-full ${i < 5 ? 'bg-emerald-600 text-white' : 'border-2 border-slate-200 text-transparent'}`}>{i < 5 && '✓'}</div></div>)}</div><div className="mt-5 rounded-lg bg-emerald-50 py-3 text-center text-sm font-medium">Amazing! You&apos;re on fire!</div></div><PerformanceChart /><div className="dashboard-card overflow-hidden"><div className="flex items-center justify-between p-5"><h2 className="section-title">Leaderboard</h2><button className="filter-button">This Week <ChevronDown size={14} /></button></div>{leaderboard.map(([rank, name, xp, medal]) => <div key={rank} className={`flex items-center gap-3 px-5 py-3 ${rank === '2' ? 'bg-emerald-50' : ''}`}><span className="w-3 text-sm text-slate-500">{rank}</span><div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-[10px] text-white">{name === 'Dawit (You)' ? 'DW' : name.slice(0, 2).toUpperCase()}</div><span className="flex-1 text-sm font-medium">{name}</span><span className="text-sm">{xp}</span><span>{medal}</span></div>)}<button onClick={() => feedback('Full leaderboard opened')} className="w-full border-t border-slate-100 py-4 text-sm font-medium text-emerald-700">View Full Leaderboard</button></div></aside></div></main></div>{notice && <div role="status" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#03251d] px-5 py-3 text-sm text-white shadow-xl lg:bottom-6">{notice}</div>}<div className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-slate-200 bg-white p-2 lg:hidden">{navItems.slice(0, 5).map(({ label, icon: Icon }) => <button key={label} onClick={() => setActive(label)} className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] ${active === label ? 'text-emerald-700' : 'text-slate-500'}`}><Icon size={19} />{label}</button>)}</div></div>
}
