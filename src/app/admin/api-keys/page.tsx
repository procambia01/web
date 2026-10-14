'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { ApiKeyDto } from '@/contracts'
import { api } from '@/lib/api'
import { formatDate, formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ErrorState } from '@/components/ui/states'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

type Row = ApiKeyDto & { userId: string }

export default function AdminApiKeys() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [revoke, setRevoke] = useState<Row | null>(null)
  const q = useQuery({ queryKey: ['admin', 'api-keys', page], queryFn: () => api.page<Row>('/admin/api-keys', { page, perPage: 20 }) })
  const cols: Column<Row>[] = [
    { key: 'n', header: 'Key', render: (k) => <span><strong>{k.name}</strong><span className="block font-mono text-xs text-[var(--color-text-muted)]">{k.keyPrefix}…</span></span> },
    { key: 'o', header: 'Owner', render: (k) => <a className="font-mono text-xs underline" href={`/admin/users/${k.userId}`}>{k.userId.slice(-8)}</a> },
    { key: 's', header: 'Scopes', render: (k) => <span className="text-xs">{k.scopes.join(', ')}</span> },
    { key: 'u', header: 'Usage', render: (k) => <span className="text-xs">{k.requestCount.toLocaleString()} / {k.monthlyQuota.toLocaleString()} · {k.lastUsedAt ? formatDateTime(k.lastUsedAt) : 'never'}</span> },
    { key: 'c', header: 'Created', render: (k) => formatDate(k.createdAt) },
    { key: 'st', header: 'Status', render: (k) => <StatusBadge label={k.revokedAt ? 'Revoked' : k.isActive ? 'Active' : 'Inactive'} variant={k.revokedAt || !k.isActive ? 'neutral' : 'success'} /> },
    { key: 'x', header: '', render: (k) => !k.revokedAt ? <Button size="sm" variant="outline" onClick={() => setRevoke(k)}>Revoke</Button> : null },
  ]
  return (
    <div>
      <PageHeader title="API keys" description="Partner keys across all members. Keys are stored hashed; only the prefix is visible." />
      {q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : <DataTable columns={cols} data={q.data?.items ?? []} keyFn={(k) => k.id} isLoading={q.isLoading} emptyTitle="No keys"
        page={q.data?.meta.page} totalPages={q.data?.meta.totalPages} total={q.data?.meta.total} perPage={20} onPageChange={setPage} />}
      {revoke && <ConfirmDialog open onOpenChange={(o) => !o && setRevoke(null)} title={`Revoke “${revoke.name}”?`} description="Applications using this key stop working immediately." confirmLabel="Revoke" destructive reasonLabel="Reason (audit log)" reasonMin={5}
        onConfirm={async (reason) => { await api.del(`/admin/api-keys/${revoke.id}`, { reason }); toast.success('Key revoked'); await qc.invalidateQueries({ queryKey: ['admin', 'api-keys'] }) }} />}
    </div>
  )
}
