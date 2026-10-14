'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { resetPasswordSchema } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { validate, type FieldErrors } from '@/lib/form'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { Notice } from '@/components/ui/states'

function Form() {
  const token = useSearchParams().get('token') ?? ''
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!token) return <Notice tone="error">This reset link is incomplete. <Link href="/forgot-password" className="underline">Request a new one</Link>.</Notice>

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const { data, errors: errs } = validate(resetPasswordSchema, { token, password })
    setErrors(errs)
    if (!data) return
    setBusy(true)
    setFormError('')
    try {
      await api.post('/auth/reset-password', data)
      toast.success('Password updated. Please sign in.')
      router.replace('/login')
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <h1 className="font-display text-3xl font-bold">Choose a new password</h1>
      {formError && <Notice tone="error">{formError}</Notice>}
      <Field label="New password" error={errors.password} hint="At least 10 characters with upper and lower case and a number." htmlFor="pw">
        <TextInput id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!errors.password} />
      </Field>
      <Button type="submit" size="lg" className="h-10 w-full" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</Button>
      <p className="text-xs text-[var(--color-text-muted)]">Changing your password signs you out of every other device.</p>
    </form>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><Form /></Suspense>
}
