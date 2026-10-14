'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import type { DisputeDto } from '@/contracts'
import { api } from '@/lib/api'
import { DISPUTE_VARIANT } from '@/lib/constants'
import { enumLabel, timeAgo } from '@/lib/format'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ErrorState } from '@/components/ui/states'
import { FilterTabs } from '@/components/admin/bits'

export default function AdminDisputes() {
  const [status, setStatus] = useState('OPEN')
  const [page, setPage] = useState(1)
  const q = useQuery({ queryKey: ['admin', 'disputes', status, page], queryFn: () => api.page<DisputeDto>('/admin/disputes', { status, page, perPage: 20 }) })
  const cols: Column<DisputeDto>[] = [
    { key: 'd', header: 'Dispute', render: (d) => <Link className="font-semibold underline" href={`/admin/disputes/${d.id}`}>{enumLabel(d.reason)}</Link> },
    { key: 'p', header: 'Priority', render: (d) => <StatusBadge label={d.priority} variant={d.priority === 'URGENT' || d.priority === 'HIGH' ? 'error' : 'neutral'} /> },
    { key: 's', header: 'Status', render: (d) => <StatusBadge label={enumLabel(d.status)} variant={DISPUTE_VARIANT[d.status]} /> },
    { key: 'e', header: 'Evidence', render: (d) => d.evidence.length },
    { key: 'c', header: 'Opened', render: (d) => timeAgo(d.createdAt) },
  ]
  return (
    <div>
      <PageHeader title="Disputes" description="Resolve conduct problems between members. CashMouver never decides who gets which cash." />
      <FilterTabs value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[['OPEN', 'Open'], ['INVESTIGATING', 'Investigating'], ['RESOLVED', 'Resolved'], ['CLOSED', 'Closed'], ['', 'All']] as const} />
      {q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : <DataTable columns={cols} data={q.data?.items ?? []} keyFn={(d) => d.id} isLoading={q.isLoading} emptyTitle="No disputes"
        page={q.data?.meta.page} totalPages={q.data?.meta.totalPages} total={q.data?.meta.total} perPage={20} onPageChange={setPage} />}
    </div>
  )
}
