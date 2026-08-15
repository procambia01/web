'use client'
import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { Search, Eye, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { adminService } from '@/services'
import { DataTable, type Column } from '@/components/ui/data-table'
import { SwapStatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { PageHeader } from '@/components/ui/page-header'
import { formatCurrency, formatRelative, getCurrencyFlag } from '@/lib/format'
import type { Swap } from '@/types'

function AdminSwapsPageContent() {
  const [status, setStatus] = useQueryState('status', { defaultValue: '' })
  const [page, setPage]     = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-swaps', status, page],
    queryFn:  () => adminService.getSwaps({ status: status || undefined, page, perPage: 20 }),
  })

  const columns: Column<Swap>[] = [
    {
      key: 'id',
      header: 'Swap ID',
      render: (s) => (
        <span className="font-mono text-xs text-[var(--color-text-secondary)]">#{s.id.slice(-10).toUpperCase()}</span>
      ),
    },
    {
      key: 'initiator',
      header: 'Initiator',
      render: (s) => (
        <div className="flex items-center gap-2">
          <UserAvatar name={s.initiator.name} image={s.initiator.image} size="xs" />
          <p className="text-sm font-body text-[var(--color-text-primary)] truncate max-w-[120px]">{s.initiator.name}</p>
        </div>
      ),
    },
    {
      key: 'receiver',
      header: 'Receiver',
      render: (s) => (
        <div className="flex items-center gap-2">
          <UserAvatar name={s.receiver.name} image={s.receiver.image} size="xs" />
          <p className="text-sm font-body text-[var(--color-text-primary)] truncate max-w-[120px]">{s.receiver.name}</p>
        </div>
      ),
    },
    {
      key: 'exchange',
      header: 'Exchange',
      render: (s) => (
        <div className="flex items-center gap-2 text-xs font-body">
          <span>{getCurrencyFlag(s.initiatorGivesCurrency)}</span>
          <span className="font-semibold text-[var(--color-text-primary)]">{formatCurrency(s.initiatorGivesAmount, s.initiatorGivesCurrency)}</span>
          <ArrowRight size={10} className="text-[var(--color-text-muted)]" />
          <span>{getCurrencyFlag(s.receiverGivesCurrency)}</span>
          <span className="font-semibold text-[var(--color-text-primary)]">{formatCurrency(s.receiverGivesAmount, s.receiverGivesCurrency)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <SwapStatusBadge status={s.status} />,
    },
    {
      key: 'created',
      header: 'Created',
      render: (s) => <p className="text-xs text-[var(--color-text-muted)] font-body">{formatRelative(s.createdAt)}</p>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16',
      render: (s) => (
        <Link href={`/admin/swaps/${s.id}`}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors ml-auto">
          <Eye size={14} />
        </Link>
      ),
    },
  ]

  const statuses = ['', 'PENDING', 'AGREED', 'IN_PROGRESS', 'CONFIRMING', 'COMPLETED', 'CANCELLED', 'DISPUTED']

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-5">
      <PageHeader title="Swap Management" description="Monitor and review all platform swaps" />

      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] w-fit">
        {statuses.map(s => (
          <button key={s || 'all'} onClick={() => { setStatus(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-body capitalize transition-all ${
              status === s
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        keyFn={s => s.id}
        isLoading={isLoading}
        emptyTitle="No swaps found"
        page={page}
        totalPages={data?.meta?.totalPages}
        total={data?.meta?.total}
        perPage={20}
        onPageChange={setPage}
      />
    </motion.div>
  )
}

export default function AdminSwapsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
        </div>
      }
    >
      <AdminSwapsPageContent />
    </Suspense>
  )
}
