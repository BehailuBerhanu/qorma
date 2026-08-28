import type { Metadata } from 'next'
import { QormaLanding } from '@/components/qorma-landing'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Qorma — Master Every Question',
  description: 'Practice past exams, understand your mistakes, and prepare smarter with Qorma.',
}

export default function LandingPage() {
  return <QormaLanding />
}
