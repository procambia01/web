'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Check } from 'lucide-react'
import type { ServiceProductDto } from '@/contracts'
import { useProducts } from '@/hooks/usePlan'
import { useCurrencies } from '@/hooks/useCurrencies'
import { buttonVariants } from '@/components/ui/button'
import { CardSkeletons, ErrorState, Notice } from '@/components/ui/states'
import { cn } from '@/lib/utils'
import { enumLabel } from '@/lib/format'

function Price({ p }: { p: ServiceProductDto }) {
  const { money } = useCurrencies()
  const per = p.interval === 'MONTH' ? '/ month' : p.interval === 'YEAR' ? '/ year' : p.durationHours ? `/ ${p.durationHours >= 24 ? `${Math.round(p.durationHours / 24)} day${p.durationHours >= 48 ? 's' : ''}` : `${p.durationHours}h`}` : ''
  return <p className="mt-2"><span className="font-display text-3xl font-bold">{money(p.amount, p.currency)}</span> <span className="text-sm text-[var(--color-text-muted)]">{per}</span></p>
}

function Card({ p, highlight }: { p: ServiceProductDto; highlight?: boolean }) {
  return (
    <div className={cn('flex flex-col rounded-2xl border bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]', highlight ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--color-border)]')}>
      <h3 className="text-lg">{p.name}</h3>
      {p.description && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{p.description}</p>}
      <Price p={p} />
      {p.trialDays > 0 && <p className="mt-1 text-xs font-semibold text-[var(--color-accent-dark)]">{p.trialDays}-day free trial</p>}
      <ul className="mt-4 flex-1 space-y-2">
        {p.features.map((f) => <li key={f} className="flex gap-2 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />{f}</li>)}
      </ul>
      <Link href={`/register?plan=${p.code}`} className={cn(buttonVariants({ size: 'lg', variant: highlight ? 'default' : 'outline' }), 'mt-6 h-10')}>Get started</Link>
    </div>
  )
}

export default function PricingPage() {
  const { data, isLoading, error, refetch } = useProducts()
  const [interval, setInterval] = useState<'MONTH' | 'YEAR'>('MONTH')
  const plans = (data ?? []).filter((p) => (p.kind === 'PREMIUM_PLAN' || p.kind === 'BUSINESS_PLAN') && p.interval === interval)
  const addons = (data ?? []).filter((p) => ['BOOST', 'FEATURED', 'VERIFICATION'].includes(p.kind))
  const hasYear = (data ?? []).some((p) => p.interval === 'YEAR')

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-bold">Simple pricing. Free swaps.</h1>
        <p className="mt-3 text-[var(--color-text-secondary)]">Swapping with other members never carries a CashMouver fee. You only pay if you choose an optional service.</p>
      </div>

      <Notice tone="info" className="mx-auto mt-8 max-w-2xl text-center">These prices pay for CashMouver services only. We never charge for, hold or refund the currency you exchange with another member.</Notice>

      {hasYear && (
        <div className="mt-8 flex justify-center" role="group" aria-label="Billing period">
          {(['MONTH', 'YEAR'] as const).map((i) => (
            <button key={i} onClick={() => setInterval(i)} aria-pressed={interval === i} className={cn('border px-5 py-2 text-sm font-medium first:rounded-l-xl last:rounded-r-xl', interval === i ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)]')}>{i === 'MONTH' ? 'Monthly' : 'Yearly'}</button>
          ))}
        </div>
      )}

      <div className="mt-10">
        {isLoading ? <CardSkeletons /> : error ? <ErrorState error={error} onRetry={() => refetch()} /> : (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
              <h3 className="text-lg">Free</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Everything you need to swap.</p>
              <p className="mt-2 font-display text-3xl font-bold">0</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {['Post and accept offers', 'In-app chat and meetup planning', 'Ratings and dispute support', 'Identity verification'].map((f) => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />{f}</li>)}
              </ul>
              <Link href="/register" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'mt-6 h-10')}>Create account</Link>
            </div>
            {plans.map((p, i) => <Card key={p.code} p={p} highlight={i === 0} />)}
          </div>
        )}
      </div>

      {addons.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Pay-as-you-go extras</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((p) => (
              <div key={p.code} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{enumLabel(p.kind)}</p>
                <h3 className="mt-1 text-base">{p.name}</h3>
                {p.description && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{p.description}</p>}
                <Price p={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
