'use client'
import { useCurrencies } from '@/hooks/useCurrencies'

/** Shows whatever currencies the admin has switched on — never a hardcoded list. */
export function LiveCurrencies() {
  const { currencies, isLoading, isError } = useCurrencies()
  if (isError || (!isLoading && currencies.length === 0)) return null
  const shown = [...currencies].sort((a, b) => Number(b.isPopular) - Number(a.isPopular) || a.sortOrder - b.sortOrder).slice(0, 24)
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="font-display text-3xl font-bold">Currencies on CashMouver</h2>
      <p className="mt-2 text-[var(--color-text-secondary)]">{currencies.length} currencies supported today, and the list grows as demand does.</p>
      <ul className="mt-6 flex flex-wrap gap-2" aria-busy={isLoading}>
        {shown.map((c) => (
          <li key={c.code} title={c.name} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm">
            <span className="font-semibold">{c.code}</span> <span className="text-[var(--color-text-muted)]">{c.symbol}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
