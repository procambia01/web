import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label:     string
  value:     string | number
  change?:   number      // positive = up, negative = down
  changePeriod?: string
  icon:      LucideIcon
  iconColor?: string
  iconBg?:   string
  gradient?: boolean
  className?: string
}

export function StatCard({
  label, value, change, changePeriod = 'vs last month',
  icon: Icon, iconColor = 'text-primary', iconBg = 'bg-primary/10',
  gradient, className,
}: StatCardProps) {
  const isUp   = (change ?? 0) >= 0
  const hasChange = change !== undefined

  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5',
        'shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]',
        gradient && 'card-gradient-border',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-secondary)] font-body">{label}</p>
          <p className="mt-1.5 text-2xl font-bold font-display text-[var(--color-text-primary)] tracking-tight">
            {value}
          </p>
          {hasChange && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-1.5 py-0.5',
                isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600')}>
                {isUp ? '↑' : '↓'} {Math.abs(change!).toFixed(1)}%
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">{changePeriod}</span>
            </div>
          )}
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
    </div>
  )
}
