'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { loginSchema, type LoginFormData } from '@/lib/validators'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router   = useRouter()
  const { login, isLoading } = useAuthStore()
  const [showPw, setShowPw]  = useState(false)

  const {
    register, handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch {
      toast.error('Invalid email or password')
    }
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h2 className="font-display font-bold text-3xl text-[var(--color-text-primary)] tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)] font-body">
          Sign in to your Cashmova account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[var(--color-text-secondary)] font-body">
            Email Address
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={cn(
              'w-full h-12 px-4 rounded-xl border bg-[var(--color-surface)] font-body text-sm',
              'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
              'transition-all outline-none',
              'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
              errors.email
                ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
                : 'border-[var(--color-border)]',
            )}
          />
          {errors.email && <p className="text-xs text-[var(--color-error)] font-body">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[var(--color-text-secondary)] font-body">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[var(--color-primary)] font-semibold hover:underline font-body"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
              className={cn(
                'w-full h-12 pl-4 pr-11 rounded-xl border bg-[var(--color-surface)] font-body text-sm',
                'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
                'transition-all outline-none',
                'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
                errors.password
                  ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
                  : 'border-[var(--color-border)]',
              )}
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-[var(--color-error)] font-body">{errors.password.message}</p>}
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            {...register('rememberMe')}
            type="checkbox"
            className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--color-text-secondary)] font-body">Remember me for 30 days</span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full h-12 rounded-xl font-display font-semibold text-white text-sm',
            'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]',
            'shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-lg)]',
            'transition-all flex items-center justify-center gap-2',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          )}
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
          {isLoading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-xs text-[var(--color-text-muted)] font-body">or continue with</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      {/* Google */}
      <button className={cn(
        'w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]',
        'flex items-center justify-center gap-3 font-body font-semibold text-sm text-[var(--color-text-primary)]',
        'hover:bg-[var(--color-bg)] transition-colors shadow-[var(--shadow-xs)]',
      )}>
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Register link */}
      <p className="text-center text-sm text-[var(--color-text-secondary)] font-body">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[var(--color-primary)] font-semibold hover:underline">
          Create account
        </Link>
      </p>
    </div>
  )
}
