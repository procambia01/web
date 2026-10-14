'use client'
import { DISPUTE_VARIANT } from '@/lib/constants'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ShieldQuestion } from 'lucide-react'
import type { DisputeDto } from '@/contracts'
import { api } from '@/lib/api'
import { enumLabel, timeAgo } from '@/lib/format'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { Pager } from '@/components/shared/Pager'
import { StatusBadge } from '@/components/ui/status-badge'


export default function DisputesPage() {
  const [page, setPage] = useState(1)
  const q = useQuery({ queryKey: ['disputes', page], queryFn: () => api.page<DisputeDto>('/disputes', { page, perPage: 15 }) })
  return (
    <div className="max-w-3xl">
      <PageHeader title="Disputes" description="Problems you've reported, or that were reported about a swap you were in." />
      {q.isLoading ? <Skeleton className="h-32" /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : q.data!.items.length === 0 ? (
        <EmptyState icon={<ShieldQuestion size={28} />} title="No disputes" description="If something goes wrong on a swap, use “Report a problem” on that swap." />
      ) : (
        <>
          <ul className="space-y-3">
            {q.data!.items.map((d) => (
              <li key={d.id}>
                <Link href={`/dashboard/disputes/${d.id}`} className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:shadow-[var(--shadow-md)]">
                  <div className="flex items-center justify-between gap-3"><p className="font-semibold">{enumLabel(d.reason)}</p><StatusBadge label={d.status} variant={DISPUTE_VARIANT[d.status]} /></div>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">{d.description}</p>
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">{d.iAmReporter ? 'You reported this' : 'Reported against you'} · {timeAgo(d.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Pager meta={q.data!.meta} onPage={setPage} />
        </>
      )}
    </div>
  )
}
