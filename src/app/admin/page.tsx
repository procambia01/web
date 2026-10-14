'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CreditCard, Flag, Megaphone, ShieldCheck, Tag, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useCurrencies } from '@/hooks/useCurrencies'
import { minorToDecimal } from '@/lib/minor'
import { enumLabel } from '@/lib/format'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { ErrorState, PageLoader } from '@/components/ui/states'

interface Dash { users: number; newUsers30d: number; activeOffers: number; swapsByStatus: Record<string, number>; openDisputes: number; pendingVerifications: number; openRiskFlags: number; activeSubscriptions: number; pendingAdReviews: number; revenueLast30d: { currency: string; entryType: string; netMinor: number }[] }

export default function AdminHome() {
  const role = useAuthStore((s) => s.user?.role)
  const { money, minorUnit } = useCurrencies()
  const q = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => api.get<Dash>('/admin/dashboard'), refetchInterval: 60_000 })
  if (q.isLoading) return <PageLoader />
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const d = q.data
  const revenue = new Map<string, number>()
  for (const r of d.revenueLast30d) revenue.set(r.currency, (revenue.get(r.currency) ?? 0) + r.netMinor)
  const queues = [
    { href: '/admin/verification', label: 'Verifications waiting', n: d.pendingVerifications, icon: ShieldCheck },
    { href: '/admin/disputes', label: 'Open disputes', n: d.openDisputes, icon: AlertTriangle },
    { href: '/admin/risk', label: 'Risk flags', n: d.openRiskFlags, icon: Flag },
    { href: '/admin/ads', label: 'Ads to review', n: d.pendingAdReviews, icon: Megaphone },
  ]
  return (
    <div>
      <PageHeader title="Overview" description="Marketplace health and what needs attention." />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {queues.map((x) => <Link key={x.href} href={x.href}><StatCard label={x.label} value={x.n} icon={x.icon} className={x.n > 0 ? 'ring-1 ring-amber-400' : ''} /></Link>)}
      </div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Members" value={d.users.toLocaleString()} icon={Users} />
        <StatCard label="New (30 days)" value={d.newUsers30d.toLocaleString()} icon={Users} />
        <StatCard label="Active offers" value={d.activeOffers.toLocaleString()} icon={Tag} />
        <StatCard label="Active subscriptions" value={d.activeSubscriptions.toLocaleString()} icon={CreditCard} />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <section><h2 className="mb-3 text-lg">Swaps by status</h2>
          <ul className="space-y-1 text-sm">{Object.entries(d.swapsByStatus).map(([k, v]) => <li key={k} className="flex justify-between border-b border-[var(--color-border)] py-1"><span>{enumLabel(k)}</span><strong>{v}</strong></li>)}</ul></section>
        {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
          <section><h2 className="mb-1 text-lg">CashMouver service revenue, last 30 days</h2>
            <p className="mb-3 text-xs text-[var(--color-text-muted)]">Net of refunds. This is money paid to CashMouver for services — never exchanged cash.</p>
            <ul className="space-y-1 text-sm">{[...revenue.entries()].map(([c, n]) => <li key={c} className="flex justify-between border-b border-[var(--color-border)] py-1"><span>{c}</span><strong>{money(minorToDecimal(n, minorUnit(c)), c)}</strong></li>)}
              {revenue.size === 0 && <li className="text-[var(--color-text-secondary)]">No revenue recorded in this period.</li>}</ul></section>
        )}
      </div>
    </div>
  )
}
