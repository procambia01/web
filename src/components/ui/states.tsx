import { AlertCircle, Inbox, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/lib/api'
import { Button } from './button'

export function Spinner({ className, size = 18 }: { className?: string; size?: number }) {
  return <Loader2 size={size} className={cn('animate-spin text-[var(--color-text-muted)]', className)} aria-label="Loading" />
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3" role="status">
      <Spinner size={24} />
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-[var(--color-border)]/60', className)} />
}

export function CardSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} className="h-44" />)}
    </div>
  )
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-14 text-center">
      <div className="mb-3 text-[var(--color-text-muted)]">{icon ?? <Inbox size={28} />}</div>
      <p className="font-display text-base font-bold text-[var(--color-text-primary)]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-error)]/30 bg-[var(--color-error-bg)] px-6 py-10 text-center dark:bg-[var(--color-error)]/10">
      <AlertCircle className="mb-2 text-[var(--color-error)]" size={26} />
      <p className="text-sm font-semibold text-[var(--color-error-text)] dark:text-[var(--color-error)]">{errorMessage(error)}</p>
      {onRetry && <Button variant="outline" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function Notice({ tone = 'info', children, className }: { tone?: 'info' | 'warning' | 'error' | 'success'; children: React.ReactNode; className?: string }) {
  const t = {
    info: 'bg-[var(--color-info-bg)] text-[var(--color-info-text)] border-[var(--color-info)]/30',
    warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border-[var(--color-warning)]/30',
    error: 'bg-[var(--color-error-bg)] text-[var(--color-error-text)] border-[var(--color-error)]/30',
    success: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--color-success)]/30',
  }[tone]
  return <div role={tone === 'error' ? 'alert' : 'note'} className={cn('rounded-xl border px-4 py-3 text-sm dark:bg-white/5 dark:text-[var(--color-text-primary)]', t, className)}>{children}</div>
}
