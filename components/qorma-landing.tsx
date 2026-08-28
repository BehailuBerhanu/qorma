'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart3, BookOpen, Check, ChevronDown, Download, Menu, PenLine, Search, Sparkles, Target, Trophy, X } from 'lucide-react'

const dashboardImage = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-zGpjgdZL3QTRNnrb4uZ5J1Rr4pdOVL.png'

const steps = [
  { icon: Search, title: 'Find a question', body: 'Search past exams by year, subject, or topic.' },
  { icon: PenLine, title: 'Attempt it', body: 'Answer questions under real exam conditions.' },
  { icon: Sparkles, title: 'Understand the mistake', body: 'Get explanations that actually make sense.' },
  { icon: Target, title: 'Practice similar', body: 'Strengthen your understanding with smart practice.' },
  { icon: Trophy, title: 'Build mastery', body: 'Track your progress and walk into exams ready.' },
]

const features = [
  { icon: BookOpen, title: 'Past exam library', body: 'Thousands of entrance exams with answers and detailed solutions.' },
  { icon: Sparkles, title: 'AI explanations', body: 'Understand every concept with step-by-step explanations.' },
  { icon: Target, title: 'Smart practice', body: 'Practice by topic, difficulty, or weak areas.' },
  { icon: BarChart3, title: 'Progress tracking', body: 'See your accuracy improve over time.' },
  { icon: Download, title: 'Offline learning', body: 'Download questions and study anywhere.' },
  { icon: Trophy, title: 'Performance analytics', body: 'Know exactly what to focus on next.' },
]

export function QormaLanding() {
  const [open, setOpen] = useState(false)
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <Link href="/landing" className="brand" aria-label="Qorma home"><span className="brand-mark">Q</span><span><strong>QORMA</strong><small>Master Every Question.</small></span></Link>
        <div className={`nav-links ${open ? 'is-open' : ''}`}>
          <a href="#how-it-works" onClick={() => setOpen(false)}>How it works</a><a href="#features" onClick={() => setOpen(false)}>Features</a><a href="#pricing" onClick={() => setOpen(false)}>Pricing</a><a href="#about" onClick={() => setOpen(false)}>About</a>
          <Link href="/sign-in" className="mobile-login">Log in</Link><Link href="/sign-up" className="nav-cta">Get started free <ArrowRight size={15} /></Link>
        </div>
        <div className="nav-actions"><Link href="/sign-in" className="desktop-login">Log in</Link><Link href="/sign-up" className="nav-cta desktop-cta">Get started free <ArrowRight size={15} /></Link><button className="menu-button" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>
      </nav>

      <section className="hero landing-container">
        <div className="hero-copy"><span className="kicker"><span className="flag-dot" /> Built for Ethiopian students</span><h1>Master every <span>question.</span></h1><p>Practice past exams, understand every mistake with AI explanations, and build the confidence to ace your next entrance exam.</p><div className="hero-buttons"><Link href="/sign-up" className="primary-button">Start practicing free <ArrowRight size={17} /></Link><a href="#features" className="secondary-button">Explore past exams</a></div><div className="proof"><div className="avatars"><i>AB</i><i>MK</i><i>HT</i><i>DN</i><i>+</i></div><div><strong>10,000+ students</strong><span>are already improving</span></div></div></div>
        <div className="hero-preview"><div className="preview-glow" /><img src={dashboardImage} alt="Qorma student dashboard showing progress and practice tools" /></div>
      </section>
      <div className="trust-row landing-container"><span><Check size={16} /> Past exam library</span><span><Check size={16} /> AI explanations</span><span><Check size={16} /> Track progress</span><span><Check size={16} /> Learn offline</span></div>

      <section id="how-it-works" className="section process-section"><div className="landing-container"><div className="section-heading"><span className="eyebrow">A better way to prepare</span><h2>How <span>Qorma</span> works</h2><p>Turn every wrong answer into a step forward.</p></div><div className="steps">{steps.map((step, i) => <div className="step" key={step.title}><div className="step-icon"><step.icon size={22} /></div><b>{step.title}</b><p>{step.body}</p>{i < steps.length - 1 && <div className="step-line" />}</div>)}</div></div></section>

      <section id="features" className="section feature-section"><div className="landing-container"><div className="section-heading"><span className="eyebrow">Everything in one place</span><h2>Tools that help you <span>get ahead.</span></h2><p>Designed around the way Ethiopian students actually prepare.</p></div><div className="feature-grid">{features.map((feature) => <article className="feature-card" key={feature.title}><div className="feature-icon"><feature.icon size={22} /></div><h3>{feature.title}</h3><p>{feature.body}</p></article>)}</div></div></section>

      <section className="metrics"><div className="landing-container metrics-inner"><div><strong>10,000+</strong><span>Active students</span></div><div><strong>40,000+</strong><span>Questions available</span></div><div><strong>98%</strong><span>Accuracy improvement</span></div><div><strong>50+</strong><span>Exams covered</span></div></div></section>

      <section id="about" className="section final-cta"><div className="landing-container cta-inner"><div><span className="eyebrow">Your next chapter starts here</span><h2>Study smarter.<br /><span>Go further.</span></h2><p>Join thousands of Ethiopian students preparing with clarity, confidence, and Qorma.</p><Link href="/sign-up" className="primary-button">Start practicing free <ArrowRight size={17} /></Link></div><div className="cta-card"><div className="mini-line" /><span>“Qorma helped me stop memorizing answers and start understanding the concepts.”</span><small>— Hana, Grade 12 student</small></div></div></section>
      <footer className="landing-footer"><div className="landing-container footer-inner"><Link href="/landing" className="brand"><span className="brand-mark">Q</span><span><strong>QORMA</strong><small>Master Every Question.</small></span></Link><span>Built for the next generation of Ethiopian learners.</span><span>© 2026 Qorma</span></div></footer>
    </main>
  )
}
