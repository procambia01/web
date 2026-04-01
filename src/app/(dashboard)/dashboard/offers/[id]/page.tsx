'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, MapPin, Calendar, Clock, Eye, Users,
  ArrowLeftRight, Pencil, Trash2, Pause, Play,
  Shield, Star, TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { offerService } from '@/services'
import { OfferStatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  formatCurrency, formatDateTime, formatRelative,
  formatRating, getCurrencyFlag, formatNumber,
  trustScoreLabel, trustScoreColor,
} from '@/lib/format'
import { useAuthStore } from '@/store/auth.store'
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

export default function OfferDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const qc       = useQueryClient()
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['offer', id],
    queryFn:  () => offerService.getById(id),
  })

  const offer = data?.data
  if (isLoading || !offer) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const isOwner = offer.userId === user?.id

  const handleDelete = async () => {
    if (!confirm('Delete this offer? This cannot be undone.')) return
    try {
      await offerService.delete(id)
      toast.success('Offer deleted')
      router.push('/dashboard/offers')
    } catch { toast.error('Failed to delete') }
  }

  const handleTogglePause = async () => {
    try {
      if (offer.status === 'PAUSED') {
        await offerService.resume(id)
        toast.success('Offer resumed')
      } else {
        await offerService.pause(id)
        toast.success('Offer paused')
      }
      qc.invalidateQueries({ queryKey: ['offer', id] })
    } catch { toast.error('Action failed') }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)] tracking-tight">
            {offer.haveCurrency} → {offer.wantCurrency}
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">
            #{id.slice(-10).toUpperCase()} · {formatRelative(offer.createdAt)}
          </p>
        </div>
        <OfferStatusBadge status={offer.status} />
        {isOwner && (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/offers/${id}/edit`}
              className="w-8 h-8 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-colors">
              <Pencil size={15} />
            </Link>
            {(offer.status === 'ACTIVE' || offer.status === 'PAUSED') && (
              <button onClick={handleTogglePause}
                className="w-8 h-8 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary-light)] transition-colors">
                {offer.status === 'PAUSED' ? <Play size={15} /> : <Pause size={15} />}
              </button>
            )}
            <button onClick={handleDelete}
              className="w-8 h-8 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Exchange hero */}
          <Card>
            <div className="grid grid-cols-3 items-center gap-4 py-4">
              <div className="text-center">
                <p className="text-5xl mb-3">{getCurrencyFlag(offer.haveCurrency)}</p>
                <p className="font-display font-bold text-3xl text-[var(--color-text-primary)]">
                  {formatCurrency(offer.haveAmount, offer.haveCurrency)}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] font-body mt-1">Offering</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center">
                  <ArrowLeftRight size={20} className="text-[var(--color-text-secondary)]" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--color-text-muted)] font-body">Rate</p>
                  <p className="text-sm font-bold text-[var(--color-text-primary)] font-body mt-0.5">
                    {offer.exchangeRate.toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-5xl mb-3">{getCurrencyFlag(offer.wantCurrency)}</p>
                <p className="font-display font-bold text-3xl text-[var(--color-text-primary)]">
                  {formatCurrency(offer.wantAmount, offer.wantCurrency)}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] font-body mt-1">Wanting</p>
              </div>
            </div>

            {/* Engagement stats */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[var(--color-divider)]">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                <Eye size={18} className="text-[var(--color-text-muted)]" />
                <div>
                  <p className="font-display font-bold text-lg text-[var(--color-text-primary)]">
                    {formatNumber(offer.viewCount, 0)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] font-body">Views</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                <Users size={18} className="text-[var(--color-text-muted)]" />
                <div>
                  <p className="font-display font-bold text-lg text-[var(--color-text-primary)]">
                    {formatNumber(offer.matchCount, 0)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] font-body">Matches</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Details */}
          <Card title="Offer Details">
            <Row label="Location" value={
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-[var(--color-text-muted)]" />
                {[offer.city, offer.state, offer.country].filter(Boolean).join(', ')}
              </span>
            } />
            <Row label="Meeting radius" value={`${offer.radius}km`} />
            <Row label="Available from" value={formatDateTime(offer.availableFrom)} />
            <Row label="Available until" value={formatDateTime(offer.availableUntil)} />
            <Row label="Flexible timing" value={offer.isFlexible ? '✅ Yes' : '❌ No'} />
            <Row label="Visibility" value={offer.visibility.replace('_', ' ')} />
            <Row label="Requires verified users" value={offer.requiresVerifiedUsers ? '✅ Yes' : '❌ No'} />
            {offer.minTrustScore > 0 && <Row label="Min trust score" value={offer.minTrustScore} />}
            {offer.expiresAt && <Row label="Expires" value={formatRelative(offer.expiresAt)} />}
          </Card>

          {/* Notes */}
          {offer.notes && (
            <Card title="Notes">
              <p className="text-sm text-[var(--color-text-secondary)] font-body leading-relaxed">{offer.notes}</p>
            </Card>
          )}
        </div>

        {/* Right: trader info */}
        <div className="space-y-5">
          <Card title="Trader">
            <div className="flex flex-col items-center text-center gap-3">
              <UserAvatar name={offer.user.name} image={offer.user.image} size="xl" verified={offer.user.idVerified} />
              <div>
                <p className="font-display font-bold text-lg text-[var(--color-text-primary)]">{offer.user.name}</p>
                {offer.user.idVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded-full font-body font-semibold mt-1">
                    <Shield size={11} /> Verified
                  </span>
                )}
              </div>
              <div className="w-full space-y-2 pt-2 border-t border-[var(--color-divider)]">
                <div className="flex items-center justify-between text-sm font-body">
                  <span className="text-[var(--color-text-secondary)] flex items-center gap-1"><Star size={13} className="text-amber-400" /> Rating</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{formatRating(offer.user.rating)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-body">
                  <span className="text-[var(--color-text-secondary)] flex items-center gap-1"><ArrowLeftRight size={13} /> Swaps</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{offer.user.totalSwaps}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-body">
                  <span className="text-[var(--color-text-secondary)] flex items-center gap-1"><TrendingUp size={13} /> Trust</span>
                  <span className={cn('font-semibold', trustScoreColor(offer.user.trustScore))}>
                    {trustScoreLabel(offer.user.trustScore)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Initiate swap CTA */}
          {!isOwner && offer.status === 'ACTIVE' && (
            <button
              onClick={() => toast.info('Connect to backend to initiate swap')}
              className="w-full h-11 rounded-xl bg-[var(--color-primary)] text-white font-semibold font-body text-sm hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--shadow-primary)] flex items-center justify-center gap-2"
            >
              <ArrowLeftRight size={16} />
              Swap with {offer.user.name.split(' ')[0]}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
