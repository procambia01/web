'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MarketStatDto } from '@/contracts'
import { ApiError, api } from '@/lib/api'
import { useEntitlements } from '@/hooks/usePlan'
import { formatDate, formatRate } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, NativeSelect } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState, ErrorState, Notice, Skeleton } from '@/components/ui/states'
import { CurrencySelect } from '@/components/shared/CurrencySelect'
import { StatCard } from '@/components/ui/stat-card'
import { ArrowLeftRight, BarChart3, TrendingUp } from 'lucide-react'
import { countryName } from '@/lib/countries'

interface Popular { base: string; quote: string; offers: number; swaps: number }

export default function InsightsPage() {
  const ent = useEntitlements()
  const advanced = !!ent.data?.features.advancedAnalytics
  const [base, setBase] = useState('EUR')
  const [quote, setQuote] = useState('USD')
  const [days, setDays] = useState('7')

  const popular = useQuery({ queryKey: ['market', 'popular'], queryFn: () => api.get<Popular[]>('/market/popular') })
  const stats = useQuery({
    queryKey: ['market', base, quote, days],
    queryFn: () => api.get<MarketStatDto[]>(`/market/${base}/${quote}`, { days }),
    enabled: !!base && !!quote && base !== quote,
    retry: false,
  })
  const geo = useQuery({ queryKey: ['market', 'geo'], queryFn: () => api.get<{ country: string; offers: number }[]>('/insights/geographic'), enabled: advanced })

  const rows = stats.data ?? []
  const latest = rows[rows.length - 1]
  const chart = rows.map((r) => ({ day: r.day, avg: Number(r.averageRate), best: Number(r.bestRate) }))
  const planBlocked = stats.error instanceof ApiError && stats.error.code === 'PLAN_REQUIRED'

  return (
    <div>
      <PageHeader title="Market insights" description="Aggregated, anonymous rates and activity. Pairs with too few offers are hidden to protect privacy." />
      <div className="mb-6 grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-3">
        <Field label="Base"><CurrencySelect value={base} onChange={setBase} exclude={quote} /></Field>
        <Field label="Quote"><CurrencySelect value={quote} onChange={setQuote} exclude={base} /></Field>
        <Field label="Period"><NativeSelect value={days} onChange={(e) => setDays(e.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days (Premium)</option></NativeSelect></Field>
      </div>

      {planBlocked ? <Notice tone="info">Longer history needs a Premium plan. <Link href="/dashboard/premium" className="font-semibold underline">See plans</Link></Notice> :
        stats.isLoading ? <Skeleton className="h-72" /> : stats.error ? <ErrorState error={stats.error} onRetry={() => stats.refetch()} /> : rows.length === 0 ? (
          <EmptyState title="Not enough activity yet" description="This pair needs more offers before we can publish anonymous statistics." />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Average offered rate" value={formatRate(latest.averageRate)} icon={BarChart3} />
              <StatCard label="Best offered rate" value={formatRate(latest.bestRate)} icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-emerald-100" />
              <StatCard label="Active offers (latest day)" value={latest.offerCount} icon={ArrowLeftRight} iconColor="text-violet-600" iconBg="bg-violet-100" />
            </div>
            <Card className="mt-6">
              <CardHeader><CardTitle>{base}/{quote} offered rate</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64" role="img" aria-label={`Line chart of average and best ${base}/${quote} offered rates`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="day" tickFormatter={(d: string) => formatDate(d)} fontSize={11} />
                      <YAxis domain={['auto', 'auto']} fontSize={11} width={56} />
                      <Tooltip />
                      <Line type="monotone" dataKey="avg" name="Average" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="best" name="Best" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Most active pairs this week</CardTitle></CardHeader>
          <CardContent>
            {popular.isLoading ? <Skeleton className="h-24" /> : (popular.data?.length ?? 0) === 0 ? <p className="text-sm text-[var(--color-text-muted)]">No pairs have enough activity yet.</p> : (
              <ul className="divide-y divide-[var(--color-divider)]">
                {popular.data!.map((p) => (
                  <li key={`${p.base}${p.quote}`}><button className="flex w-full items-center justify-between py-2.5 text-sm hover:text-[var(--color-primary)]" onClick={() => { setBase(p.base); setQuote(p.quote) }}><span className="font-semibold">{p.base}/{p.quote}</span><span className="text-[var(--color-text-muted)]">{p.offers} offers · {p.swaps} swaps</span></button></li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Where offers are posted</CardTitle></CardHeader>
          <CardContent>
            {!advanced ? <p className="text-sm text-[var(--color-text-secondary)]">Geographic activity is part of Premium analytics. <Link href="/dashboard/premium" className="font-semibold text-[var(--color-primary)] underline">Upgrade</Link></p> :
              geo.isLoading ? <Skeleton className="h-24" /> : (geo.data?.length ?? 0) === 0 ? <p className="text-sm text-[var(--color-text-muted)]">No data yet.</p> : (
                <ul className="divide-y divide-[var(--color-divider)]">{geo.data!.slice(0, 10).map((g) => <li key={g.country} className="flex justify-between py-2.5 text-sm"><span>{countryName(g.country)}</span><span className="text-[var(--color-text-muted)]">{g.offers} offers</span></li>)}</ul>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
