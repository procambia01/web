'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import type { OfferDto } from '@/contracts'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { buttonVariants } from '@/components/ui/button'
import { CardSkeletons, EmptyState, ErrorState } from '@/components/ui/states'
import { OfferCard } from '@/components/shared/OfferCard'
import { Pager } from '@/components/shared/Pager'
import { cn } from '@/lib/utils'

const TABS = [['', 'All'], ['ACTIVE', 'Active'], ['PAUSED', 'Paused'], ['COMPLETED', 'Completed'], ['EXPIRED', 'Expired'], ['CANCELLED', 'Cancelled']] as const

export default function MyOffersPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const q = useQuery({ queryKey: ['offers', 'mine', status, page], queryFn: () => api.page<OfferDto>('/offers/mine', { status, page, perPage: 12 }) })
  return (
    <div>
      <PageHeader title="My offers" description="Offers you have posted." actions={<Link href="/dashboard/offers/create" className={buttonVariants()}><Plus size={14} /> New offer</Link>} />
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {TABS.map(([v, l]) => (
          <button key={v} role="tab" aria-selected={status === v} onClick={() => { setStatus(v); setPage(1) }} className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium', status === v ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)]')}>{l}</button>
        ))}
      </div>
      {q.isLoading ? <CardSkeletons /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : q.data!.items.length === 0 ? (
        <EmptyState title="No offers here" description="Post an offer to let people near you know what you can exchange." action={<Link href="/dashboard/offers/create" className={buttonVariants()}>Create an offer</Link>} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{q.data!.items.map((o) => <OfferCard key={o.id} offer={o} />)}</div>
          <Pager meta={q.data!.meta} onPage={setPage} />
        </>
      )}
    </div>
  )
}
