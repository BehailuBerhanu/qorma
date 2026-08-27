import { Analytics } from '@vercel/analytics/next'
import { Geist } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Qorma — Master Every Question',
  description: 'A focused learning dashboard for mastering every question.',
  generator: 'Qorma',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f8faf9',
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="bg-[#f8faf9]"><body className={`${geist.variable} antialiased`}>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
