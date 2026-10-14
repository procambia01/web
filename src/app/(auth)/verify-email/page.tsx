'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { api, errorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { PageLoader } from '@/components/ui/states'
import { buttonVariants } from '@/components/ui/button'

function Verify() {
  const token = useSearchParams().get('token')
  const [state, setState] = useState<'working' | 'ok' | 'error'>(token ? 'working' : 'error')
  const [message, setMessage] = useState(token ? '' : 'This verification link is incomplete.')
  const ran = useRef(false)
  const refreshUser = useAuthStore((s) => s.refreshUser)

  useEffect(() => {
    if (!token || ran.current) return
    ran.current = true
    api.post('/auth/verify-email', { token })
      .then(() => { setState('ok'); void refreshUser().catch(() => undefined) })
      .catch((e) => { setState('error'); setMessage(errorMessage(e)) })
  }, [token, refreshUser])

  if (state === 'working') return <PageLoader label="Verifying your email…" />
  return (
    <div className="space-y-4 text-center">
      {state === 'ok' ? <CheckCircle2 className="mx-auto text-[var(--color-success)]" size={44} /> : <XCircle className="mx-auto text-[var(--color-error)]" size={44} />}
      <h1 className="font-display text-2xl font-bold">{state === 'ok' ? 'Email verified' : 'We could not verify your email'}</h1>
      {message && <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>}
      <Link href="/dashboard" className={buttonVariants({ size: 'lg' })}>Go to dashboard</Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return <Suspense><Verify /></Suspense>
}
