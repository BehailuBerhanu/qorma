'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, signUp } from '@/lib/auth-client'

export default function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') || '')
    const password = String(data.get('password') || '')
    const name = String(data.get('name') || '')
    const result = isSignUp
      ? await signUp.email({ email, password, name })
      : await signIn.email({ email, password })
    setPending(false)
    if (result.error) {
      setError('Unable to authenticate with those details.')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-mark">Q</div>
        <p className="eyebrow">QORMA</p>
        <h1>{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-copy">{isSignUp ? 'Start mastering every question.' : 'Continue your learning journey.'}</p>
        <form onSubmit={submit}>
          {isSignUp && <input name="name" placeholder="Full name" required />}
          <input name="email" type="email" placeholder="Email address" required />
          <input name="password" type="password" placeholder="Password" minLength={8} required />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={pending}>{pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}</button>
        </form>
        <p className="auth-switch">{isSignUp ? 'Already have an account?' : 'New to Qorma?'} <Link href={isSignUp ? '/sign-in' : '/sign-up'}>{isSignUp ? 'Sign in' : 'Create account'}</Link></p>
      </section>
    </main>
  )
}
