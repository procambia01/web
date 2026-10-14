import { cn } from '@/lib/utils'
import { SWAP_STATUS_STYLE, OFFER_STATUS_STYLE } from '@/lib/constants'

type Variant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'

const VARIANT_STYLES: Record<Variant, string> = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  error:   'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  info:    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
}

interface StatusBadgeProps {
  label:      string
  variant?:   Variant
  dot?:       boolean
  className?: string
}

export function StatusBadge({ label, variant = 'neutral', dot, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide font-body',
      VARIANT_STYLES[variant],
      className,
    )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {label}
    </span>
  )
}

// Convenience wrappers
export function SwapStatusBadge({ status }: { status: string }) {
  const cls = SWAP_STATUS_STYLE[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide font-body', cls)}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export function OfferStatusBadge({ status }: { status: string }) {
  const cls = OFFER_STATUS_STYLE[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide font-body', cls)}>
      {status}
    </span>
  )
}
