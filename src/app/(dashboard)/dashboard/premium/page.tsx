'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Crown } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ServiceProductDto, SubscriptionDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { startCheckout } from '@/lib/checkout'
import { useCurrencies } from '@/hooks/useCurrencies'
import { useEntitlements, useProducts } from '@/hooks/usePlan'
import { useAuthStore } from '@/store/auth.store'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { CardSkeletons, ErrorState, Notice } from '@/components/ui/states'
import Link from 'next/link'

export default function PremiumPage() {
  const me = useAuthStore((s) => s.user)!
  const { money } = useCurrencies()
  const products = useProducts()
  const ent = useEntitlements()
  const subs = useQuery({ queryKey: ['subscriptions'], queryFn: () => api.get<SubscriptionDto[]>('/billing/subscriptions') })
  const [interval, setInterval] = useState<'MONTH' | 'YEAR'>('MONTH')
  const [busy, setBusy] = useState<string | null>(null)

  const plans = (products.data ?? []).filter((p) => (p.kind === 'PREMIUM_PLAN' || p.kind === 'BUSINESS_PLAN') && p.interval === interval)
  const hasYear = (products.data ?? []).some((p) => p.interval === 'YEAR' && (p.kind === 'PREMIUM_PLAN' || p.kind === 'BUSINESS_PLAN'))
  const active = subs.data?.find((s) => ['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(s.status))

  async function choose(p: ServiceProductDto) {
    setBusy(p.code)
    try { await startCheckout('subscription', { productCode: p.code }) } catch (e) { toast.error(errorMessage(e)); setBusy(null) }
  }

  return (
    <div>
      <PageHeader title="Plans & boosts" description="Swapping is always free. Plans add visibility, limits and tools." />
      <Notice tone="info" className="mb-6">Payments here are for CashMouver services only. We never charge for, hold or refund the cash you exchange with other members.</Notice>

      {active && (
        <Notice tone={active.status === 'PAST_DUE' ? 'warning' : 'success'} className="mb-6">
          You&apos;re on <strong>{active.tier}</strong> ({active.status.replace('_', ' ').toLowerCase()}).{active.currentPeriodEnd && ` ${active.cancelAtPeriodEnd ? 'Ends' : 'Renews'} ${formatDate(active.currentPeriodEnd)}.`} Manage it in <Link className="font-semibold underline" href="/dashboard/billing">Billing</Link>.
          {active.status === 'PAST_DUE' && ' Your last payment failed — please update your card.'}
        </Notice>
      )}

      {hasYear && (
        <div className="mb-6 flex" role="group" aria-label="Billing period">
          {(['MONTH', 'YEAR'] as const).map((i) => <button key={i} onClick={() => setInterval(i)} aria-pressed={interval === i} className={cn('border px-5 py-2 text-sm font-medium first:rounded-l-xl last:rounded-r-xl', interval === i ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)]')}>{i === 'MONTH' ? 'Monthly' : 'Yearly'}</button>)}
        </div>
      )}

      {products.isLoading ? <CardSkeletons /> : products.error ? <ErrorState error={products.error} onRetry={() => products.refetch()} /> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => {
            const current = me.planTier === p.planTier && !!active
            return (
              <div key={p.code} className={cn('flex flex-col rounded-2xl border bg-[var(--color-surface)] p-6', current ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--color-border)]')}>
                <h3 className="flex items-center gap-2 text-lg">{p.planTier === 'PREMIUM' && <Crown size={16} className="text-amber-500" />}{p.name}</h3>
                {p.description && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{p.description}</p>}
                <p className="mt-3"><span className="font-display text-3xl font-bold">{money(p.amount, p.currency)}</span> <span className="text-sm text-[var(--color-text-muted)]">/ {p.interval === 'MONTH' ? 'month' : 'year'}</span></p>
                {p.trialDays > 0 && !current && <p className="mt-1 text-xs font-semibold text-[var(--color-accent-dark)]">{p.trialDays}-day free trial</p>}
                <ul className="mt-4 flex-1 space-y-2 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />{f}</li>)}</ul>
                <Button className="mt-6 h-10" disabled={current || !!active || busy === p.code} onClick={() => choose(p)}>{current ? 'Current plan' : active ? 'Manage in Billing' : busy === p.code ? 'Redirecting…' : 'Choose plan'}</Button>
              </div>
            )
          })}
        </div>
      )}

      {ent.data && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg">Your current limits ({ent.data.planTier.toLowerCase()})</h2>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            {[
              ['Active offers', `${ent.data.usage.activeOffers} / ${ent.data.limits.maxActiveOffers}`],
              ['Active swaps', `${ent.data.usage.activeSwaps} / ${ent.data.limits.maxActiveSwaps}`],
              ['Rate alerts', `${ent.data.usage.rateAlerts} / ${ent.data.limits.maxRateAlerts}`],
              ['Boosts this month', `${ent.data.usage.boostsThisMonth} / ${ent.data.limits.maxBoostPurchasesMonth}`],
              ['Max per swap', money(ent.data.limits.maxSwap, ent.data.limits.limitCurrency)],
              ['Daily volume', money(ent.data.limits.daily, ent.data.limits.limitCurrency)],
              ['Weekly volume', money(ent.data.limits.weekly, ent.data.limits.limitCurrency)],
              ['Monthly volume', money(ent.data.limits.monthly, ent.data.limits.limitCurrency)],
            ].map(([l, v]) => <div key={l} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><dt className="text-[var(--color-text-muted)]">{l}</dt><dd className="font-semibold">{v}</dd></div>)}
          </dl>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">Limits are measured in {ent.data.limits.limitCurrency}-equivalent and depend on your plan and verification level. <Link className="underline" href="/dashboard/verification">Verify to raise them.</Link></p>
        </section>
      )}
      <p className="mt-8 text-sm text-[var(--color-text-secondary)]">Want to boost or feature one offer instead? Open it from <Link className={buttonVariants({ variant: 'link' })} href="/dashboard/offers">My offers</Link>.</p>
    </div>
  )
}
