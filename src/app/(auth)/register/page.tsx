'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { registerSchema } from '@/contracts'
import { errorMessage, api } from '@/lib/api'
import { validate, serverErrors, type FieldErrors } from '@/lib/form'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, TextInput } from '@/components/ui/field'
import { Notice } from '@/components/ui/states'
import { useEffect } from 'react'

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const register = useAuthStore((s) => s.register)
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', referralCode: params.get('ref') ?? '' })
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    const code = params.get('ref')
    if (code) void api.post(`/referrals/click/${encodeURIComponent(code)}`).catch(() => undefined)
  }, [params])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const { data, errors: errs } = validate(registerSchema, { ...f, phone: f.phone.trim() || undefined, referralCode: f.referralCode.trim() || undefined })
    if (!agree) errs.terms = 'Please accept the terms to continue'
    setErrors(errs)
    if (!data || !agree) return
    setBusy(true)
    try {
      await register(data)
      router.replace('/dashboard')
    } catch (err) {
      setErrors(serverErrors(err))
      setFormError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">Create your account</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Free to join. No fee on swaps between members.</p>
      </div>
      {formError && <Notice tone="error">{formError}</Notice>}
      <Field label="Full name" error={errors.name} htmlFor="name"><TextInput id="name" autoComplete="name" value={f.name} onChange={set('name')} invalid={!!errors.name} /></Field>
      <Field label="Email" error={errors.email} htmlFor="email"><TextInput id="email" type="email" autoComplete="email" value={f.email} onChange={set('email')} invalid={!!errors.email} /></Field>
      <Field label="Password" error={errors.password} hint="At least 10 characters with upper and lower case and a number." htmlFor="password">
        <TextInput id="password" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} invalid={!!errors.password} />
      </Field>
      <Field label="Mobile number (optional)" error={errors.phone} hint="International format, e.g. +442071234567" htmlFor="phone">
        <TextInput id="phone" type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} invalid={!!errors.phone} placeholder="+442071234567" />
      </Field>
      <Field label="Referral code (optional)" error={errors.referralCode} htmlFor="ref"><TextInput id="ref" value={f.referralCode} onChange={set('referralCode')} /></Field>
      <div>
        <Checkbox checked={agree} onChange={setAgree}>
          I understand CashMouver only connects people. I exchange cash directly with other members, and CashMouver never holds, escrows or refunds that money.
        </Checkbox>
        {errors.terms && <p role="alert" className="mt-1 text-xs text-[var(--color-error)]">{errors.terms}</p>}
      </div>
      <Button type="submit" size="lg" className="h-10 w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
      <p className="text-center text-sm text-[var(--color-text-secondary)]">Already a member? <Link href="/login" className="text-[var(--color-primary)] hover:underline">Sign in</Link></p>
    </form>
  )
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
