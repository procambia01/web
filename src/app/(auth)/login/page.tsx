'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { loginSchema } from '@/contracts'
import { ApiError, errorMessage } from '@/lib/api'
import { validate, type FieldErrors } from '@/lib/form'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { Notice } from '@/components/ui/states'

function safeNext(n: string | null) {
  return n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard'
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [needsCode, setNeedsCode] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const { data, errors: errs } = validate(loginSchema, { email, password, twoFactorCode: code.trim().toUpperCase() || undefined })
    setErrors(errs)
    if (!data) return
    setBusy(true)
    try {
      await login(data)
      router.replace(safeNext(params.get('next')))
    } catch (err) {
      if (err instanceof ApiError && err.code === 'TWO_FACTOR_REQUIRED') {
        setNeedsCode(true)
        setFormError('Enter the 6-digit code from your authenticator app (or a backup code).')
      } else {
        setFormError(errorMessage(err))
        if (needsCode) toast.error('Sign-in failed')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">Welcome back</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Sign in to your CashMouver account.</p>
      </div>
      {formError && <Notice tone={needsCode && !errors.twoFactorCode ? 'info' : 'error'}>{formError}</Notice>}
      <Field label="Email" error={errors.email} htmlFor="email">
        <TextInput id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} disabled={needsCode} placeholder="you@example.com" />
      </Field>
      <Field label="Password" error={errors.password} htmlFor="password">
        <TextInput id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!errors.password} disabled={needsCode} />
      </Field>
      {needsCode && (
        <Field label="Authentication code" error={errors.twoFactorCode} htmlFor="code">
          <TextInput id="code" inputMode="text" autoComplete="one-time-code" autoFocus value={code} onChange={(e) => setCode(e.target.value)} invalid={!!errors.twoFactorCode} placeholder="123456" />
        </Field>
      )}
      <Button type="submit" size="lg" className="h-10 w-full" disabled={busy}>{busy ? 'Signing in…' : needsCode ? 'Verify and sign in' : 'Sign in'}</Button>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-[var(--color-primary)] hover:underline">Forgot password?</Link>
        <Link href="/register" className="text-[var(--color-primary)] hover:underline">Create an account</Link>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
