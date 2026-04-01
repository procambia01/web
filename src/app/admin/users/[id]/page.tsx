'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Ban, CheckCircle, Shield, Star, ArrowLeftRight } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { adminService } from '@/services'
import { UserAvatar } from '@/components/ui/user-avatar'
import { StatusBadge, SwapStatusBadge, OfferStatusBadge } from '@/components/ui/status-badge'
import {
  formatRating, formatNumber, formatRelative,
  formatDateTime, formatCurrency, getCurrencyFlag,
  trustScoreLabel, trustScoreColor,
} from '@/lib/format'
import { cn } from '@/lib/utils'

const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
    {title && <h3 className="font-display font-bold text-[var(--color-text-primary)] mb-4">{title}</h3>}
    {children}
  </div>
)

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-divider)] last:border-0">
    <span className="text-sm text-[var(--color-text-secondary)] font-body">{label}</span>
    <span className="text-sm font-semibold text-[var(--color-text-primary)] font-body text-right">{value}</span>
  </div>
)

export default function AdminUserDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const qc      = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn:  () => adminService.getUserById(id),
  })

  const user = data?.data
  if (isLoading || !user) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const handleBan = async () => {
    const reason = prompt(`Reason to ban ${user.name}:`)
    if (!reason) return
    try {
      await adminService.banUser(user.id, reason)
      toast.success('User banned')
      qc.invalidateQueries({ queryKey: ['admin-user', id] })
    } catch { toast.error('Action failed') }
  }

  const handleUnban = async () => {
    if (!confirm(`Unban ${user.name}?`)) return
    try {
      await adminService.unbanUser(user.id)
      toast.success('User unbanned')
      qc.invalidateQueries({ queryKey: ['admin-user', id] })
    } catch { toast.error('Action failed') }
  }

  const handleVerify = async (approve: boolean) => {
    try {
      if (approve) {
        await adminService.approveVerification(user.id)
        toast.success('Verification approved')
      } else {
        const reason = prompt('Reason for rejection:')
        if (!reason) return
        await adminService.rejectVerification(user.id, reason)
        toast.success('Verification rejected')
      }
      qc.invalidateQueries({ queryKey: ['admin-user', id] })
    } catch { toast.error('Action failed') }
  }

  const verVar = user.verificationStatus === 'VERIFIED' ? 'success' : user.verificationStatus === 'PENDING' ? 'warning' : user.verificationStatus === 'REJECTED' ? 'error' : 'neutral'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)] flex-1">User Detail</h1>
        <div className="flex items-center gap-2">
          {user.verificationStatus === 'PENDING' && (
            <>
              <button onClick={() => handleVerify(true)}
                className="h-8 px-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold font-body hover:bg-emerald-700 transition-colors flex items-center gap-1.5">
                <CheckCircle size={13} /> Approve
              </button>
              <button onClick={() => handleVerify(false)}
                className="h-8 px-3 rounded-xl bg-red-600 text-white text-xs font-semibold font-body hover:bg-red-700 transition-colors flex items-center gap-1.5">
                <Shield size={13} /> Reject
              </button>
            </>
          )}
          {!user.isBanned ? (
            <button onClick={handleBan}
              className="h-8 px-3 rounded-xl border border-red-200 text-red-600 text-xs font-semibold font-body hover:bg-red-50 transition-colors flex items-center gap-1.5">
              <Ban size={13} /> Ban
            </button>
          ) : (
            <button onClick={handleUnban}
              className="h-8 px-3 rounded-xl border border-emerald-200 text-emerald-600 text-xs font-semibold font-body hover:bg-emerald-50 transition-colors flex items-center gap-1.5">
              <CheckCircle size={13} /> Unban
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="space-y-5">
          <Card>
            <div className="flex flex-col items-center text-center gap-3">
              <UserAvatar name={user.name} image={user.image} size="2xl" verified={user.idVerified} />
              <div>
                <h2 className="font-display font-bold text-xl text-[var(--color-text-primary)]">{user.name}</h2>
                <p className="text-sm text-[var(--color-text-muted)] font-body">{user.email}</p>
                {user.phone && <p className="text-sm text-[var(--color-text-muted)] font-body">{user.phone}</p>}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <StatusBadge label={user.role} variant="primary" />
                <StatusBadge label={user.verificationStatus} variant={verVar} dot />
                <StatusBadge
                  label={user.isBanned ? 'Banned' : user.isSuspended ? 'Suspended' : user.isActive ? 'Active' : 'Inactive'}
                  variant={user.isBanned ? 'error' : user.isSuspended ? 'warning' : 'success'}
                  dot
                />
              </div>
            </div>
          </Card>

          <Card title="Trust Score">
            <div className="text-center">
              <p className={cn('font-display font-black text-5xl', trustScoreColor(user.trustScore))}>
                {user.trustScore}
              </p>
              <p className={cn('text-sm font-semibold font-body mt-1', trustScoreColor(user.trustScore))}>
                {trustScoreLabel(user.trustScore)}
              </p>
              <div className="mt-3 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]"
                  style={{ width: `${Math.min(user.trustScore, 100)}%` }} />
              </div>
            </div>
          </Card>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-5">
          <Card title="Account Details">
            <DetailRow label="User ID" value={<span className="font-mono text-xs">{user.id}</span>} />
            <DetailRow label="Joined" value={formatRelative(user.createdAt)} />
            <DetailRow label="Location" value={[user.city, user.country].filter(Boolean).join(', ') || '—'} />
            <DetailRow label="Premium" value={user.isPremium ? `${user.premiumTier}${user.premiumExpiry ? ` (expires ${formatRelative(user.premiumExpiry)})` : ''}` : 'No'} />
            {user.isBanned && user.banReason && <DetailRow label="Ban reason" value={user.banReason} />}
          </Card>

          <Card title="Swap Statistics">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total', value: user.totalSwaps, icon: '🔄' },
                { label: 'Completed', value: user.successfulSwaps, icon: '✅' },
                { label: 'Failed', value: user.failedSwaps, icon: '❌' },
                { label: 'Rating', value: formatRating(user.rating), icon: '⭐' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <p className="text-xl mb-1">{icon}</p>
                  <p className="font-display font-bold text-lg text-[var(--color-text-primary)]">{value}</p>
                  <p className="text-xs text-[var(--color-text-muted)] font-body">{label}</p>
                </div>
              ))}
            </div>
          </Card>

          {user.bio && (
            <Card title="Bio">
              <p className="text-sm text-[var(--color-text-secondary)] font-body leading-relaxed">{user.bio}</p>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )
}
