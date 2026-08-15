'use client'
import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { Search, Shield, Ban, CheckCircle, Eye, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { adminService } from '@/services'
import { DataTable, type Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { PageHeader } from '@/components/ui/page-header'
import { formatNumber, formatRelative, formatRating, trustScoreLabel, trustScoreColor } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

function AdminUsersPageContent() {
  const [search, setSearch]   = useQueryState('q', { defaultValue: '' })
  const [role, setRole]       = useQueryState('role', { defaultValue: '' })
  const [verified, setVerified] = useQueryState('verified', { defaultValue: '' })
  const [page, setPage]       = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', search, role, verified, page],
    queryFn:  () => adminService.getUsers({
      search: search || undefined,
      role:   role   || undefined,
      idVerified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      page, perPage: 20,
    }),
  })

  const handleBan = async (u: User) => {
    const reason = prompt(`Reason to ban ${u.name}:`)
    if (!reason) return
    try {
      await adminService.banUser(u.id, reason)
      toast.success(`${u.name} banned`)
      refetch()
    } catch { toast.error('Action failed') }
  }

  const handleUnban = async (u: User) => {
    if (!confirm(`Unban ${u.name}?`)) return
    try {
      await adminService.unbanUser(u.id)
      toast.success(`${u.name} unbanned`)
      refetch()
    } catch { toast.error('Action failed') }
  }

  const roleVariant = (r: string) =>
    r === 'ADMIN' || r === 'SUPER_ADMIN' ? 'primary' :
    r === 'STAFF' ? 'info' : 'neutral'

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={u.name} image={u.image} size="sm" verified={u.idVerified} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body truncate max-w-[160px]">{u.name}</p>
            <p className="text-xs text-[var(--color-text-muted)] font-body truncate max-w-[160px]">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => <StatusBadge label={u.role} variant={roleVariant(u.role) as 'primary' | 'info' | 'neutral'} />,
    },
    {
      key: 'verification',
      header: 'Verified',
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
      render: (u) => (
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body">{formatNumber(u.totalSwaps, 0)}</p>
          <p className="text-xs text-[var(--color-text-muted)] font-body">⭐ {formatRating(u.rating)}</p>
        </div>
      ),
    },
    {
      key: 'trust',
      header: 'Trust',
      render: (u) => (
        <p className={cn('text-sm font-semibold font-body', trustScoreColor(u.trustScore))}>
          {trustScoreLabel(u.trustScore)}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <StatusBadge
          label={u.isBanned ? 'Banned' : u.isSuspended ? 'Suspended' : u.isActive ? 'Active' : 'Inactive'}
          variant={u.isBanned ? 'error' : u.isSuspended ? 'warning' : 'success'}
          dot
        />
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (u) => <p className="text-xs text-[var(--color-text-muted)] font-body">{formatRelative(u.createdAt)}</p>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (u) => (
        <div className="flex items-center gap-1 justify-end">
          <Link href={`/admin/users/${u.id}`}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
            title="View">
            <Eye size={14} />
          </Link>
          {!u.isBanned ? (
            <button onClick={() => handleBan(u)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Ban user">
              <Ban size={14} />
            </button>
          ) : (
            <button onClick={() => handleUnban(u)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Unban user">
              <CheckCircle size={14} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-5">
      <PageHeader
        title="User Management"
        description={`${formatNumber(data?.meta?.total ?? 0, 0)} total users`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name or email…"
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-body text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1) }}
          className="h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-body text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)] transition-all appearance-none cursor-pointer">
          <option value="">All roles</option>
          <option value="USER">User</option>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={verified} onChange={e => { setVerified(e.target.value); setPage(1) }}
          className="h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-body text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)] transition-all appearance-none cursor-pointer">
          <option value="">All verification</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        keyFn={u => u.id}
        isLoading={isLoading}
        emptyTitle="No users found"
        page={page}
        totalPages={data?.meta?.totalPages}
        total={data?.meta?.total}
        perPage={20}
        onPageChange={setPage}
      />
    </motion.div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
        </div>
      }
    >
      <AdminUsersPageContent />
    </Suspense>
  )
}
