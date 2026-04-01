'use client'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { ArrowLeft, Loader2, Mail, Send } from 'lucide-react'
import { useState } from 'react'
import { authService } from '@/services/auth.service'
import { forgotPasswordSchema, type ForgotPasswordData } from '@/lib/validators'
import { cn } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const [sent, setSent]           = useState(false)
  const [submittedEmail, setEmail] = useState('')
  const [loading, setLoading]     = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async ({ email }: ForgotPasswordData) => {
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setEmail(email)
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--color-accent-light)] flex items-center justify-center">
        <Mail className="w-8 h-8 text-[var(--color-accent)]" />
      </div>
      <div>
        <h2 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">Check your email</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)] font-body">
          We sent a reset link to <span className="font-semibold text-[var(--color-text-primary)]">{submittedEmail}</span>
        </p>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] font-body">
        Didn&apos;t receive it? Check spam or{' '}
        <button onClick={() => setSent(false)} className="text-[var(--color-primary)] font-semibold hover:underline">
          try again
        </button>
      </p>
      <Link href="/login" className={cn(
        'flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-[var(--color-border)]',
        'bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-primary)] font-body',
        'hover:bg-[var(--color-bg)] transition-colors',
      )}>
        <ArrowLeft size={16} /> Back to Sign In
      </Link>
    </div>
  )

  return (
    <div className="space-y-7">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-body transition-colors">
        <ArrowLeft size={15} /> Back to Sign In
      </Link>

      <div>
        <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <h2 className="font-display font-bold text-3xl text-[var(--color-text-primary)] tracking-tight">
          Forgot password?
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)] font-body text-sm">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[var(--color-text-secondary)] font-body">Email Address</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@example.com"
            className={cn(
              'w-full h-12 px-4 rounded-xl border bg-[var(--color-surface)] font-body text-sm',
              'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
              'transition-all outline-none focus:ring-2',
              errors.email
                ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
                : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20',
            )}
          />
          {errors.email && <p className="text-xs text-[var(--color-error)] font-body">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full h-12 rounded-xl font-display font-semibold text-white text-sm',
            'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]',
            'shadow-[var(--shadow-primary)] transition-all flex items-center justify-center gap-2',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          )}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  )
}
