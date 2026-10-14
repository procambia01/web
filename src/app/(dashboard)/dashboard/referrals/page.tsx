'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, Gift, Link2, MousePointerClick, UserCheck, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ReferralItemDto, ReferralSummaryDto } from '@/contracts'
import { api } from '@/lib/api'
import { useCurrencies } from '@/hooks/useCurrencies'
import { enumLabel, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState, ErrorState, Notice, Skeleton } from '@/components/ui/states'
import { Pager } from '@/components/shared/Pager'

export default function ReferralsPage() {
  const { money } = useCurrencies()
  const [page, setPage] = useState(1)
  const summary = useQuery({ queryKey: ['referrals'], queryFn: () => api.get<ReferralSummaryDto>('/referrals') })
  const list = useQuery({ queryKey: ['referrals', 'list', page], queryFn: () => api.page<ReferralItemDto>('/referrals/list', { page, perPage: 10 }) })

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); toast.success('Copied') } catch { toast.error('Copy failed — select the link and copy it manually') }
  }
  if (summary.isLoading) return <Skeleton className="h-64" />
  if (summary.error || !summary.data) return <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
  const s = summary.data

  return (
    <div className="max-w-4xl">
      <PageHeader title="Referrals" description="Invite friends. You earn a reward only when they complete a meaningful action — not just for signing up." />
      <Card className="mb-6">
        <CardContent className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold"><Link2 size={16} /> Your invite link</p>
          <div className="flex gap-2"><input readOnly value={s.link} aria-label="Referral link" className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm" onFocus={(e) => e.currentTarget.select()} /><Button variant="outline" size="lg" className="h-10" onClick={() => copy(s.link)}><Copy size={14} /> Copy</Button></div>
          <p className="text-xs text-[var(--color-text-muted)]">Code: <strong>{s.code}</strong></p>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Link clicks" value={s.clicks} icon={MousePointerClick} />
        <StatCard label="Sign-ups" value={s.signups} icon={UserPlus} iconColor="text-violet-600" iconBg="bg-violet-100" />
        <StatCard label="Qualified" value={s.qualified} icon={UserCheck} iconColor="text-emerald-600" iconBg="bg-emerald-100" />
        <StatCard label="Rewarded" value={s.rewarded} icon={Gift} iconColor="text-amber-600" iconBg="bg-amber-100" />
      </div>
      <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
        {s.earnings.length ? <>Earned so far: {s.earnings.map((e) => money(e.amount, e.currency)).join(', ')}. </> : 'No rewards earned yet. '}
        {s.pending > 0 && `${s.pending} referral${s.pending > 1 ? 's' : ''} awaiting qualification or review.`}
      </p>
      <Notice tone="info" className="mt-4">Rewards are CashMouver marketing credits for genuine new members. Referrals that look automated or duplicate are reviewed and may be declined.</Notice>

      <h2 className="mb-3 mt-8 text-lg">Your referrals</h2>
      {list.isLoading ? <Skeleton className="h-32" /> : list.error ? <ErrorState error={list.error} /> : list.data!.items.length === 0 ? <EmptyState title="No referrals yet" description="Share your link to get started." /> : (
        <>
          <ul className="divide-y divide-[var(--color-divider)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {list.data!.items.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div><p className="font-semibold">{r.referredName}</p><p className="text-xs text-[var(--color-text-muted)]">Joined {formatDate(r.createdAt)}{r.qualifyingAction && ` · needs: ${enumLabel(r.qualifyingAction)}`}</p></div>
                <div className="text-right"><span className="rounded-full bg-[var(--color-bg)] px-2.5 py-0.5 text-xs font-semibold">{enumLabel(r.status)}</span>{r.reward && <p className="mt-1 text-xs text-[var(--color-success-text)]">{money(r.reward.amount, r.reward.currency)}</p>}</div>
              </li>
            ))}
          </ul>
          <Pager meta={list.data!.meta} onPage={setPage} />
        </>
      )}
    </div>
  )
}
