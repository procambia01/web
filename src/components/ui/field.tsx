'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

export function Field({ label, error, hint, children, className, htmlFor }: {
  label?: string
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
  htmlFor?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-xs text-[var(--color-error)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
      ) : null}
    </div>
  )
}

const control =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:opacity-60 aria-[invalid=true]:border-[var(--color-error)]'

export const TextInput = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'> & { invalid?: boolean }>(
  ({ className, invalid, ...p }, ref) => <input ref={ref} aria-invalid={invalid || undefined} className={cn(control, 'h-10', className)} {...p} />,
)
TextInput.displayName = 'TextInput'

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'> & { invalid?: boolean }>(
  ({ className, invalid, ...p }, ref) => <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(control, 'min-h-24 py-2', className)} {...p} />,
)
TextArea.displayName = 'TextArea'

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'> & { invalid?: boolean }>(
  ({ className, invalid, children, ...p }, ref) => (
    <select ref={ref} aria-invalid={invalid || undefined} className={cn(control, 'h-10 pr-8', className)} {...p}>
      {children}
    </select>
  ),
)
NativeSelect.displayName = 'NativeSelect'

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50', checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]')}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]" />
      <span>{children}</span>
    </label>
  )
}
