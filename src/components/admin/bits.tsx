'use client'
import { cn } from '@/lib/utils'

export function FilterTabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly (readonly [T, string])[] }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2" role="tablist">
      {options.map(([v, l]) => (
        <button key={v} role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium', value === v ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)]')}>{l}</button>
      ))}
    </div>
  )
}

export function Kv({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4 border-b border-[var(--color-border)] py-1.5 text-sm"><dt className="text-[var(--color-text-muted)]">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
}

export function Json({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-[var(--color-text-muted)]">—</span>
  return <pre className="max-h-40 overflow-auto rounded-lg bg-[var(--color-bg)] p-2 text-xs">{JSON.stringify(value, null, 1)}</pre>
}
