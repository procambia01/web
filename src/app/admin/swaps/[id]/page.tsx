'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowLeftRight, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { adminService } from '@/services'
import { SwapStatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  formatCurrency, formatDateTime, formatRelative,
  formatRating, getCurrencyFlag, trustScoreLabel, trustScoreColor,
} from '@/lib/format'
import { cn } from '@/lib/utils'

const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
    {title && <h3 className="font-display font-bold text-[var(--color-text-primary)] mb-4">{title}</h3>}
    {children}
  </div>
)

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-divider)] last:border-0">
    <span className="text-sm text-[var(--color-text-secondary)] font-body">{label}</span>
    <span className="text-sm font-semibold text-[var(--color-text-primary)] font-body">{value}</span>
  </div>
)

const ParticipantCard = ({ label, user, gives, givesAmt, sent, received }: {
  label: string; user: { name: string; image: string | null; idVerified: boolean; rating: number; totalSwaps: number; trustScore: number };
  gives: string; givesAmt: number; sent: boolean; received: boolean;
}) => {
  const { colors } = { colors: null }
  return (
    <Card title={label}>
      <div className="flex items-center gap-3 mb-4">
        <UserAvatar name={user.name} image={user.image} size="md" verified={user.idVerified} />
        <div>
          <p className="font-semibold text-sm text-[var(--color-text-primary)] font-body">{user.name}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-text-muted)] font-body">
            <span>⭐ {formatRating(user.rating)}</span>
            <span>·</span>
            <span>{user.totalSwaps} swaps</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-body">
          <span className="text-[var(--color-text-secondary)]">Gives</span>
          <span className="font-bold text-[var(--color-text-primary)]">{formatCurrency(givesAmt, gives)}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-body">
          <span className="text-[var(--color-text-muted)]">Sent confirmed</span>
          <span className={sent ? 'text-emerald-600 font-semibold' : 'text-[var(--color-text-muted)]'}>{sent ? '✅ Yes' : '⏳ No'}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-body">
          <span className="text-[var(--color-text-muted)]">Received confirmed</span>
          <span className={received ? 'text-emerald-600 font-semibold' : 'text-[var(--color-text-muted)]'}>{received ? '✅ Yes' : '⏳ No'}</span>
        </div>
      </div>
    </Card>
  )
}

export default function AdminSwapDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const qc      = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-swap', id],
    queryFn:  () => adminService.getSwaps({ id }),
  })

  // Use the first result if filtering by ID, or get all and find
  const swap = (data?.data ?? [])[0]

  if (isLoading || !swap) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">Swap Details</h1>
          <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">#{swap.id.slice(-10).toUpperCase()}</p>
        </div>
        <SwapStatusBadge status={swap.status} />
      </div>

      {/* Exchange summary */}
      <Card>
        <div className="grid grid-cols-3 items-center gap-4 py-2">
          <div className="text-center">
            <p className="text-4xl mb-2">{getCurrencyFlag(swap.initiatorGivesCurrency)}</p>
            <p className="font-display font-bold text-2xl text-[var(--color-text-primary)]">
              {formatCurrency(swap.initiatorGivesAmount, swap.initiatorGivesCurrency)}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] font-body mt-1">{swap.initiator.name} gives</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center">
              <ArrowLeftRight size={18} className="text-[var(--color-text-muted)]" />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] font-body">Rate {swap.agreedExchangeRate.toFixed(4)}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl mb-2">{getCurrencyFlag(swap.receiverGivesCurrency)}</p>
            <p className="font-display font-bold text-2xl text-[var(--color-text-primary)]">
              {formatCurrency(swap.receiverGivesAmount, swap.receiverGivesCurrency)}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] font-body mt-1">{swap.receiver.name} gives</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ParticipantCard
          label="Initiator" user={swap.initiator}
          gives={swap.initiatorGivesCurrency} givesAmt={swap.initiatorGivesAmount}
          sent={swap.initiatorSentConfirmed} received={swap.initiatorReceivedConfirmed}
        />
        <ParticipantCard
          label="Receiver" user={swap.receiver}
          gives={swap.receiverGivesCurrency} givesAmt={swap.receiverGivesAmount}
          sent={swap.receiverSentConfirmed} received={swap.receiverReceivedConfirmed}
        />
      </div>

      <Card title="Swap Details">
        <Row label="Created"    value={formatRelative(swap.createdAt)} />
        <Row label="Updated"    value={formatRelative(swap.updatedAt)} />
        {swap.meetupLocation && <Row label="Meetup location" value={swap.meetupLocation} />}
        {swap.meetupTime     && <Row label="Meetup time"     value={formatDateTime(swap.meetupTime)} />}
        {swap.completedAt    && <Row label="Completed"       value={formatRelative(swap.completedAt)} />}
        {swap.cancelledAt    && <Row label="Cancelled"       value={formatRelative(swap.cancelledAt)} />}
        {swap.cancellationReason && (
          <div className="pt-3 mt-1">
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-body">{swap.cancellationReason}</p>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
