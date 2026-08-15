'use client'
import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { adminService } from '@/services'
import { DataTable, type Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { PageHeader } from '@/components/ui/page-header'
import { formatRelative } from '@/lib/format'
import type { User } from '@/types'

function AdminVerificationsPageContent() {
  const [status, setStatus] = useQueryState('status', { defaultValue: 'PENDING' })
  const [page, setPage]     = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-verifications', status, page],
    queryFn:  () => adminService.getVerifications({ verificationStatus: status || undefined, page, perPage: 20 }),
  })

  const handleApprove = async (u: User) => {
    if (!confirm(`Approve verification for ${u.name}?`)) return
    try {
      await adminService.approveVerification(u.id)
      toast.success(`${u.name} verified`)
      refetch()
    } catch { toast.error('Failed') }
  }

  const handleReject = async (u: User) => {
    const reason = prompt(`Reason for rejecting ${u.name}'s verification:`)
    if (!reason) return
    try {
      await adminService.rejectVerification(u.id, reason)
      toast.success('Verification rejected')
      refetch()
    } catch { toast.error('Failed') }
  }

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={u.name} image={u.image} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body truncate max-w-[180px]">{u.name}</p>
            <p className="text-xs text-[var(--color-text-muted)] font-body truncate max-w-[180px]">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (u) => (
        <p className="text-sm text-[var(--color-text-secondary)] font-body">{u.phone ?? '—'}</p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <StatusBadge
          label={u.verificationStatus}
          variant={u.verificationStatus === 'VERIFIED' ? 'success' : u.verificationStatus === 'PENDING' ? 'warning' : u.verificationStatus === 'REJECTED' ? 'error' : 'neutral'}
          dot
        />
      ),
    },
    {
      key: 'swaps',
      header: 'Swaps',
      render: (u) => <p className="text-sm text-[var(--color-text-secondary)] font-body">{u.totalSwaps}</p>,
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (u) => <p className="text-xs text-[var(--color-text-muted)] font-body">{formatRelative(u.createdAt)}</p>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (u) => (
        <div className="flex items-center gap-1 justify-end">
          <Link href={`/admin/verifications/${u.id}`}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
            title="View documents">
            <Eye size={14} />
          </Link>
          {u.verificationStatus === 'PENDING' && (
            <>
              <button onClick={() => handleApprove(u)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Approve">
                <CheckCircle size={14} />
              </button>
              <button onClick={() => handleReject(u)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Reject">
                <XCircle size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  const tabs = ['PENDING', 'VERIFIED', 'REJECTED', 'UNVERIFIED']

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-5">
      <PageHeader
        title="Identity Verifications"
        description="Review submitted verification documents"
      />

      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => { setStatus(t); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-body capitalize transition-all ${
              status === t
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}>
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        keyFn={u => u.id}
        isLoading={isLoading}
        emptyTitle="No verifications"
        emptyDesc="Verification requests will appear here"
        page={page}
        totalPages={data?.meta?.totalPages}
        total={data?.meta?.total}
        perPage={20}
        onPageChange={setPage}
      />
    </motion.div>
  )
}

export default function AdminVerificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
        </div>
      }
    >
      <AdminVerificationsPageContent />
    </Suspense>
  )
}
