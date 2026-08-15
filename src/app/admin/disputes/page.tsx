'use client'
import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { Search, Eye, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { adminService } from '@/services'
import { DataTable, type Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { PageHeader } from '@/components/ui/page-header'
import { formatRelative, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Dispute } from '@/types'

const PRIORITY_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = {
  URGENT: 'error', HIGH: 'warning', MEDIUM: 'info', LOW: 'neutral',
}
const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'neutral' | 'error'> = {
  OPEN: 'warning', INVESTIGATING: 'info', RESOLVED: 'success',
  CLOSED: 'neutral', ESCALATED: 'error',
}

function AdminDisputesPageContent() {
  const [status, setStatus]   = useQueryState('status', { defaultValue: '' })
  const [priority, setPriority] = useQueryState('priority', { defaultValue: '' })
  const [page, setPage]       = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-disputes', status, priority, page],
    queryFn:  () => adminService.getDisputes({
      status:   status   || undefined,
      priority: priority || undefined,
      page, perPage: 20,
    }),
  })

  const handleResolve = async (d: Dispute) => {
    const resolution = prompt(`Resolution for dispute ${d.id.slice(-8)}:`)
    if (!resolution) return
    try {
      await adminService.resolveDispute(d.id, resolution)
      toast.success('Dispute resolved')
      refetch()
    } catch { toast.error('Failed to resolve') }
  }

  const columns: Column<Dispute>[] = [
    {
      key: 'id',
      header: 'Dispute',
      render: (d) => (
        <div>
          <p className="text-sm font-mono font-semibold text-[var(--color-text-primary)]">#{d.id.slice(-8).toUpperCase()}</p>
          <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5 capitalize">{d.reason.replace('_', ' ').toLowerCase()}</p>
        </div>
      ),
    },
    {
      key: 'reporter',
      header: 'Reporter',
      render: (d) => (
        <div className="flex items-center gap-2">
          <UserAvatar name={d.reporter.name} image={d.reporter.image} size="xs" />
          <p className="text-sm font-body text-[var(--color-text-primary)] truncate max-w-[120px]">{d.reporter.name}</p>
        </div>
      ),
    },
    {
      key: 'swap',
      header: 'Swap',
      render: (d) => (
        <div className="text-xs font-body text-[var(--color-text-secondary)]">
          <p>{formatCurrency(d.swap.initiatorGivesAmount, d.swap.initiatorGivesCurrency)}</p>
          <p className="text-[var(--color-text-muted)]">↔ {formatCurrency(d.swap.receiverGivesAmount, d.swap.receiverGivesCurrency)}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (d) => <StatusBadge label={d.priority} variant={PRIORITY_VARIANT[d.priority] ?? 'neutral'} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => <StatusBadge label={d.status} variant={STATUS_VARIANT[d.status] ?? 'neutral'} dot />,
    },
    {
      key: 'created',
      header: 'Filed',
      render: (d) => <p className="text-xs text-[var(--color-text-muted)] font-body">{formatRelative(d.createdAt)}</p>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (d) => (
        <div className="flex items-center gap-1 justify-end">
          <Link href={`/admin/disputes/${d.id}`}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors">
            <Eye size={14} />
          </Link>
          {d.status === 'OPEN' || d.status === 'INVESTIGATING' ? (
            <button onClick={() => handleResolve(d)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Resolve">
              <CheckCircle size={14} />
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-5">
      <PageHeader
        title="Disputes"
        description="Review and resolve user disputes"
      />

      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-body text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)] transition-all appearance-none cursor-pointer">
          <option value="">All statuses</option>
          {['OPEN','INVESTIGATING','RESOLVED','CLOSED','ESCALATED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1) }}
          className="h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-body text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)] transition-all appearance-none cursor-pointer">
          <option value="">All priorities</option>
          {['URGENT','HIGH','MEDIUM','LOW'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        keyFn={d => d.id}
        isLoading={isLoading}
        emptyTitle="No disputes found"
        emptyDesc="All disputes will appear here"
        page={page}
        totalPages={data?.meta?.totalPages}
        total={data?.meta?.total}
        perPage={20}
        onPageChange={setPage}
      />
    </motion.div>
  )
}

export default function AdminDisputesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
        </div>
      }
    >
      <AdminDisputesPageContent />
    </Suspense>
  )
}
