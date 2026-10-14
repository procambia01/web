'use client'
import { useState } from 'react'
import Link from 'next/link'
import { forgotPasswordSchema } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { validate } from '@/lib/form'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { Notice } from '@/components/ui/states'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const { data, errors } = validate(forgotPasswordSchema, { email })
    if (!data) return setError(errors.email ?? 'Enter a valid email')
    setBusy(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', data)
      setSent(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold">Check your email</h1>
        <Notice tone="success">If an account exists for {email}, a reset link is on its way. It expires shortly, so use it soon.</Notice>
        <Link href="/login" className="text-sm text-[var(--color-primary)] hover:underline">Back to sign in</Link>
      </div>
    )
  }
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div>
        <h1 className="font-display text-3xl font-bold">Reset your password</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">We&apos;ll email you a link to choose a new one.</p>
      </div>
      <Field label="Email" error={error} htmlFor="email"><TextInput id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!error} /></Field>
      <Button type="submit" size="lg" className="h-10 w-full" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</Button>
      <Link href="/login" className="block text-center text-sm text-[var(--color-primary)] hover:underline">Back to sign in</Link>
    </form>
  )
}
