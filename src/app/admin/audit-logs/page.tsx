'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { Field, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ErrorState } from '@/components/ui/states'
import { Json } from '@/components/admin/bits'

interface Log { id: string; actorId: string | null; action: string; targetType: string | null; targetId: string | null; reason: string | null; ipAddress: string | null; before: unknown; after: unknown; createdAt: string }

export default function AdminAudit() {
  const [action, setAction] = useState('')
  const [target, setTarget] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<string | null>(null)
  const q = useQuery({ queryKey: ['admin', 'audit', action, target, page], queryFn: () => api.page<Log>('/admin/audit-logs', { action, targetType: target, page, perPage: 25 }) })
  const cols: Column<Log>[] = [
    { key: 't', header: 'When', render: (l) => formatDateTime(l.createdAt) },
    { key: 'a', header: 'Action', render: (l) => <button className="font-mono text-xs underline" onClick={() => setOpen(open === l.id ? null : l.id)}>{l.action}</button> },
    { key: 'g', header: 'Target', render: (l) => <span className="text-xs">{l.targetType}<br />{l.targetId}</span> },
    { key: 'w', header: 'Actor', render: (l) => <span className="font-mono text-xs">{l.actorId ?? 'system'}</span> },
    { key: 'r', header: 'Reason / details', render: (l) => <div className="max-w-sm text-xs">{l.reason}{open === l.id && <div className="mt-2 space-y-1"><Json value={l.before} /><Json value={l.after} />{l.ipAddress && <p>IP {l.ipAddress}</p>}</div>}</div> },
  ]
  return (
    <div>
      <PageHeader title="Audit log" description="Immutable record of staff and security actions." />
      <div className="mb-5 flex flex-wrap gap-3">
        <Field label="Action contains"><TextInput value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} placeholder="e.g. verification" /></Field>
        <Field label="Target type"><TextInput value={target} onChange={(e) => { setTarget(e.target.value); setPage(1) }} placeholder="e.g. Payment" /></Field>
      </div>
      {q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : <DataTable columns={cols} data={q.data?.items ?? []} keyFn={(l) => l.id} isLoading={q.isLoading} emptyTitle="No entries"
        page={q.data?.meta.page} totalPages={q.data?.meta.totalPages} total={q.data?.meta.total} perPage={25} onPageChange={setPage} />}
    </div>
  )
}
