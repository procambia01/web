'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, MessageSquare } from 'lucide-react'
import type { SwapDto } from '@/contracts'
import { api } from '@/lib/api'
import { useCurrencies } from '@/hooks/useCurrencies'
import { PageHeader } from '@/components/ui/page-header'
import { SwapStatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { Pager } from '@/components/shared/Pager'
import { SwapRow } from '@/components/shared/SwapRow'
import { buttonVariants } from '@/components/ui/button'
import { formatRate, timeLeft, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'

const TABS = [['ACTIVE', 'In progress'], ['PENDING', 'Requests'], ['COMPLETED', 'Completed'], ['CANCELLED', 'Cancelled'], ['DISPUTED', 'Disputed'], ['', 'All']] as const

export default function SwapsPage() {
  const [status, setStatus] = useState<string>('ACTIVE')
  const [page, setPage] = useState(1)
  const q = useQuery({ queryKey: ['swaps', status, page], queryFn: () => api.page<SwapDto>('/swaps', { status, page, perPage: 12 }) })
  return (
    <div className="max-w-4xl">
      <PageHeader title="My swaps" description="Requests you've sent and received." actions={<Link href="/dashboard/market" className={buttonVariants({ variant: 'outline' })}>Find offers</Link>} />
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {TABS.map(([v, l]) => <button key={v} role="tab" aria-selected={status === v} onClick={() => { setStatus(v); setPage(1) }} className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium', status === v ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)]')}>{l}</button>)}
      </div>
      {q.isLoading ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> :
        q.data!.items.length === 0 ? <EmptyState title="Nothing here yet" description="Request a swap from the marketplace, or wait for someone to request yours." action={<Link href="/dashboard/market" className={buttonVariants()}>Browse offers</Link>} /> : (
          <><div className="space-y-3">{q.data!.items.map((s) => <SwapRow key={s.id} s={s} />)}</div><Pager meta={q.data!.meta} onPage={setPage} /></>
        )}
    </div>
  )
}
