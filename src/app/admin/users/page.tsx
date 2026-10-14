'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { enumLabel, formatDate } from '@/lib/format'
import { Field, NativeSelect, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ErrorState } from '@/components/ui/states'

interface AdminUserRow { id: string; email: string; name: string; role: string; planTier: string; verificationTier: string; isBanned: boolean; isSuspended: boolean; tradingRestricted: boolean; createdAt: string; country: string | null }

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const list = useQuery({ queryKey: ['admin', 'users', q, role, status, page], queryFn: () => api.page<AdminUserRow>('/admin/users', { search: q, role, status, page, perPage: 20 }) })
  const cols: Column<AdminUserRow>[] = [
    { key: 'u', header: 'Member', render: (u) => <Link className="font-semibold underline" href={`/admin/users/${u.id}`}>{u.name}<span className="block text-xs font-normal text-[var(--color-text-muted)]">{u.email}</span></Link> },
    { key: 'r', header: 'Role', render: (u) => enumLabel(u.role) },
    { key: 'p', header: 'Plan', render: (u) => enumLabel(u.planTier) },
    { key: 'v', header: 'Verification', render: (u) => enumLabel(u.verificationTier) },
    { key: 's', header: 'State', render: (u) => u.isBanned ? <StatusBadge label="Banned" variant="error" /> : u.isSuspended ? <StatusBadge label="Suspended" variant="warning" /> : u.tradingRestricted ? <StatusBadge label="Trading off" variant="warning" /> : <StatusBadge label="Active" variant="success" /> },
    { key: 'c', header: 'Joined', render: (u) => formatDate(u.createdAt) },
  ]
  return (
    <div>
      <PageHeader title="Members" />
      <form className="mb-5 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); setQ(search); setPage(1) }}>
        <Field label="Search" className="min-w-64"><TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email" /></Field>
        <Field label="Role"><NativeSelect value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}><option value="">All</option>{['USER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'].map((r) => <option key={r} value={r}>{enumLabel(r)}</option>)}</NativeSelect></Field>
        <Field label="State"><NativeSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">All</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="banned">Banned</option></NativeSelect></Field>
      </form>
      {list.error ? <ErrorState error={list.error} onRetry={() => list.refetch()} /> : (
        <DataTable columns={cols} data={list.data?.items ?? []} keyFn={(u) => u.id} isLoading={list.isLoading} emptyTitle="No members match"
          page={list.data?.meta.page} totalPages={list.data?.meta.totalPages} total={list.data?.meta.total} perPage={20} onPageChange={setPage} />
      )}
    </div>
  )
}
