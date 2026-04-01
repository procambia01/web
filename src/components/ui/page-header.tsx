import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title:       string
  description?: string
  actions?:    React.ReactNode
  className?:  string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)] tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)] font-body">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  )
}
