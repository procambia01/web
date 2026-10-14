'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { enumLabel, formatDateTime } from '@/lib/format'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ErrorState } from '@/components/ui/states'
import { FilterTabs } from '@/components/admin/bits'

interface Ev { id: string; stripeEventId: string; eventType: string; livemode: boolean; status: string; attempts: number; error: string | null; receivedAt: string; processedAt: string | null }
const V: Record<string, 'success' | 'error' | 'info' | 'neutral'> = { PROCESSED: 'success', FAILED: 'error', PROCESSING: 'info', RECEIVED: 'info', IGNORED: 'neutral' }

export default function AdminWebhooks() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const q = useQuery({ queryKey: ['admin', 'webhooks', status, page], queryFn: () => api.page<Ev>('/admin/webhook-events', { status, page, perPage: 25 }) })
  const cols: Column<Ev>[] = [
    { key: 'r', header: 'Received', render: (e) => formatDateTime(e.receivedAt) },
    { key: 't', header: 'Event', render: (e) => <span>{e.eventType}<span className="block font-mono text-xs text-[var(--color-text-muted)]">{e.stripeEventId}{e.livemode ? '' : ' (test)'}</span></span> },
    { key: 's', header: 'Status', render: (e) => <StatusBadge label={enumLabel(e.status)} variant={V[e.status] ?? 'neutral'} /> },
    { key: 'a', header: 'Attempts', render: (e) => e.attempts },
    { key: 'e', header: 'Error', render: (e) => <span className="max-w-xs text-xs text-red-600">{e.error}</span> },
  ]
  return (
    <div>
      <PageHeader title="Stripe events" description="Verified, de-duplicated webhook deliveries. Payments are only confirmed from these — never from the browser redirect." />
      <FilterTabs value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[['', 'All'], ['FAILED', 'Failed'], ['PROCESSED', 'Processed'], ['IGNORED', 'Ignored'], ['RECEIVED', 'Received']] as const} />
      {q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : <DataTable columns={cols} data={q.data?.items ?? []} keyFn={(e) => e.id} isLoading={q.isLoading} emptyTitle="No events"
        page={q.data?.meta.page} totalPages={q.data?.meta.totalPages} total={q.data?.meta.total} perPage={25} onPageChange={setPage} />}
    </div>
  )
}
