'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertTriangle, ArrowLeftRight } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { adminService } from '@/services'
import { StatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { formatRelative, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

const PRIORITY_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = {
  URGENT: 'error', HIGH: 'warning', MEDIUM: 'info', LOW: 'neutral',
}
const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'neutral' | 'error'> = {
  OPEN: 'warning', INVESTIGATING: 'info', RESOLVED: 'success',
  CLOSED: 'neutral', ESCALATED: 'error',
}

const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
    {title && <h3 className="font-display font-bold text-[var(--color-text-primary)] mb-4">{title}</h3>}
    {children}
  </div>
)

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-divider)] last:border-0">
    <span className="text-sm text-[var(--color-text-secondary)] font-body">{label}</span>
    <span className="text-sm font-semibold text-[var(--color-text-primary)] font-body text-right max-w-[60%]">{value}</span>
  </div>
)

export default function AdminDisputeDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const qc      = useQueryClient()
  const [resolution, setResolution] = useState('')
  const [resolveNote, setResolveNote] = useState('')
  const [loading, setLoading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dispute', id],
    queryFn:  () => adminService.getDisputeById(id),
  })

  const dispute = data?.data
  if (isLoading || !dispute) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const handleResolve = async () => {
    if (!resolution.trim()) { toast.error('Resolution is required'); return }
    setLoading(true)
    try {
      await adminService.resolveDispute(id, resolution, resolveNote || undefined)
      toast.success('Dispute resolved')
      qc.invalidateQueries({ queryKey: ['admin-dispute', id] })
    } catch { toast.error('Failed to resolve') }
    finally { setLoading(false) }
  }

  const canResolve = dispute.status === 'OPEN' || dispute.status === 'INVESTIGATING'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">Dispute Details</h1>
          <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">#{id.slice(-10).toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge label={dispute.priority} variant={PRIORITY_VARIANT[dispute.priority] ?? 'neutral'} />
          <StatusBadge label={dispute.status} variant={STATUS_VARIANT[dispute.status] ?? 'neutral'} dot />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Dispute info */}
          <Card title="Dispute Information">
            <Row label="Reason" value={dispute.reason.replace(/_/g, ' ')} />
            <Row label="Filed" value={formatRelative(dispute.createdAt)} />
            {dispute.resolvedAt && <Row label="Resolved" value={formatRelative(dispute.resolvedAt)} />}
            <div className="pt-3">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] font-body uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-[var(--color-text-primary)] font-body leading-relaxed bg-[var(--color-bg)] rounded-xl p-3 border border-[var(--color-border)]">
                {dispute.description}
              </p>
            </div>
          </Card>

          {/* Swap summary */}
          <Card title="Related Swap">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
              <span className="text-2xl">💱</span>
              <div className="flex items-center gap-2 text-sm font-body font-semibold text-[var(--color-text-primary)]">
                {formatCurrency(dispute.swap.initiatorGivesAmount, dispute.swap.initiatorGivesCurrency)}
                <ArrowLeftRight size={14} className="text-[var(--color-text-muted)]" />
                {formatCurrency(dispute.swap.receiverGivesAmount, dispute.swap.receiverGivesCurrency)}
              </div>
            </div>
          </Card>

          {/* Resolution */}
          {canResolve && (
            <Card title="Resolve Dispute">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] font-body block mb-1.5">
                    Resolution <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <textarea
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                    rows={3}
                    placeholder="Describe the resolution decision…"
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-body text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] font-body block mb-1.5">
                    Internal Note (optional)
                  </label>
                  <textarea
                    value={resolveNote}
                    onChange={e => setResolveNote(e.target.value)}
                    rows={2}
                    placeholder="Internal notes visible only to admins…"
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-body text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 resize-none"
                  />
                </div>
                <button
                  onClick={handleResolve}
                  disabled={loading || !resolution.trim()}
                  className="h-10 px-5 rounded-xl bg-emerald-600 text-white text-sm font-semibold font-body hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <CheckCircle size={16} />}
                  Mark as Resolved
                </button>
              </div>
            </Card>
          )}

          {dispute.resolution && (
            <Card title="Resolution">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-sm text-emerald-800 font-body leading-relaxed">{dispute.resolution}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Right */}
        <div className="space-y-5">
          <Card title="Reporter">
            <div className="flex items-center gap-3">
              <UserAvatar name={dispute.reporter.name} image={dispute.reporter.image} size="md" />
              <div>
                <p className="font-semibold text-sm text-[var(--color-text-primary)] font-body">{dispute.reporter.name}</p>
                <p className="text-xs text-[var(--color-text-muted)] font-body">#{dispute.reporter.id.slice(-8)}</p>
              </div>
            </div>
          </Card>

          {/* Evidence */}
          {dispute.evidence && dispute.evidence.length > 0 && (
            <Card title="Evidence">
              <div className="space-y-2">
                {dispute.evidence.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-xs text-[var(--color-primary)] font-body hover:bg-[var(--color-primary-light)] transition-colors">
                    📎 Evidence {i + 1}
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )
}
