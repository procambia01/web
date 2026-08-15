'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowLeftRight, MapPin, Calendar, CheckCircle2,
  XCircle, MessageSquare, Star, AlertTriangle, Clock,
  Send, Check, CheckCheck, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { swapService, feeService } from '@/services'
import { SwapStatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useAuthStore } from '@/store/auth.store'
import {
  formatCurrency, formatDateTime, formatRelative,
  formatRating, getCurrencyFlag, trustScoreLabel, trustScoreColor,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Swap } from '@/types'

// ── Timeline step ─────────────────────────────────────────
const STEPS = [
  { key: 'PENDING',     label: 'Requested',      icon: Clock       },
  { key: 'AGREED',      label: 'Agreed',          icon: CheckCircle2 },
  { key: 'IN_PROGRESS', label: 'Meeting Set',     icon: MapPin      },
  { key: 'CONFIRMING',  label: 'Confirming',      icon: Send        },
  { key: 'COMPLETED',   label: 'Completed',       icon: CheckCheck  },
]
const STATUS_ORDER = STEPS.map(s => s.key)

function SwapTimeline({ status }: { status: string }) {
  const current = STATUS_ORDER.indexOf(status)
  const isFailed = ['CANCELLED','DISPUTED','FAILED','EXPIRED'].includes(status)
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done   = !isFailed && i < current
        const active = !isFailed && i === current
        const Icon   = step.icon
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all',
                done   ? 'bg-emerald-500 border-emerald-500 text-white' :
                active ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-[var(--shadow-primary)]' :
                isFailed && i <= current ? 'bg-red-500 border-red-500 text-white' :
                'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-muted)]',
              )}>
                {done ? <Check size={16} /> : <Icon size={15} />}
              </div>
              <span className={cn(
                'text-[10px] font-semibold font-body whitespace-nowrap',
                done || active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]',
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mb-5 mx-1',
                done ? 'bg-emerald-500' : 'bg-[var(--color-border)]',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Confirmation checks ───────────────────────────────────
function ConfirmRow({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
        checked ? 'bg-emerald-500' : 'bg-[var(--color-border)]',
      )}>
        {checked && <Check size={11} className="text-white" />}
      </div>
      <span className={cn('text-sm font-body', checked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]')}>
        {label}
      </span>
    </div>
  )
}

// ── Detail row ────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-divider)] last:border-0">
      <span className="text-sm text-[var(--color-text-secondary)] font-body">{label}</span>
      <span className="text-sm font-semibold text-[var(--color-text-primary)] font-body text-right">{value}</span>
    </div>
  )
}

// ── Rating Modal ──────────────────────────────────────────
function RatingModal({ swapId, onClose }: { swapId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [stars, setStars]     = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!stars) { toast.error('Please select a rating'); return }
    setLoading(true)
    try {
      await swapService.rate(swapId, { stars, comment: comment || undefined })
      toast.success('Rating submitted!')
      qc.invalidateQueries({ queryKey: ['swap', swapId] })
      onClose()
    } catch { toast.error('Failed to submit rating') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] p-6">
        <h3 className="font-display font-bold text-xl text-[var(--color-text-primary)] mb-2">Rate this Swap</h3>
        <p className="text-sm text-[var(--color-text-secondary)] font-body mb-6">How was your experience?</p>
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setStars(s)}
              className={cn('text-3xl transition-transform hover:scale-110', s <= stars ? 'text-amber-400' : 'text-[var(--color-border)]')}>
              ★
            </button>
          ))}
        </div>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
          placeholder="Leave a comment (optional)…"
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-body text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 resize-none mb-5"
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-[var(--color-border)] text-sm font-semibold font-body text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || !stars}
            className="flex-1 h-10 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold font-body hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Star size={15} /> Submit
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function SwapDetailPage() {
  const { id }     = useParams<{ id: string }>()
  const router     = useRouter()
  const { user }   = useAuthStore()
  const qc         = useQueryClient()
  const [ratingOpen, setRatingOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['swap', id],
    queryFn:  () => swapService.getById(id),
  })

  const swap = data?.data

  const { data: feeData } = useQuery({
    queryKey: ['swap-fee', id],
    queryFn:  () => feeService.getStatus(id),
    enabled:  swap?.status === 'COMPLETED',
  })
  const fee = feeData?.data
  const [isPayingFee, setIsPayingFee] = useState(false)

  const handlePayFee = async () => {
    setIsPayingFee(true)
    try {
      const res = await feeService.createCheckout(id)
      if (res.data.url) window.location.href = res.data.url
    } catch {
      toast.error('Could not start checkout')
    } finally {
      setIsPayingFee(false)
    }
  }

  if (isLoading || !swap) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const isInit  = swap.initiatorId === user?.id
  const me      = isInit ? swap.initiator : swap.receiver
  const partner = isInit ? swap.receiver  : swap.initiator
  const myGivesCurr = isInit ? swap.initiatorGivesCurrency : swap.receiverGivesCurrency
  const myGivesAmt  = isInit ? swap.initiatorGivesAmount   : swap.receiverGivesAmount
  const myGetsCurr  = isInit ? swap.receiverGivesCurrency  : swap.initiatorGivesCurrency
  const myGetsAmt   = isInit ? swap.receiverGivesAmount    : swap.initiatorGivesAmount
  const mySent      = isInit ? swap.initiatorSentConfirmed    : swap.receiverSentConfirmed
  const myReceived  = isInit ? swap.initiatorReceivedConfirmed : swap.receiverReceivedConfirmed
  const theirSent   = isInit ? swap.receiverSentConfirmed    : swap.initiatorSentConfirmed

  const canAccept   = !isInit && swap.status === 'PENDING'
  const canSent     = ['AGREED','IN_PROGRESS','CONFIRMING'].includes(swap.status) && !mySent
  const canReceived = mySent && !myReceived && swap.status === 'CONFIRMING'
  const canCancel   = ['PENDING','AGREED'].includes(swap.status)
  const canRate     = swap.status === 'COMPLETED'

  const mutate = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.success(msg); qc.invalidateQueries({ queryKey: ['swap', id] }) }
    catch { toast.error('Action failed') }
  }

  return (
    <>
      {ratingOpen && <RatingModal swapId={id} onClose={() => setRatingOpen(false)} />}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)] tracking-tight">Swap Details</h1>
            <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">#{id.slice(-10).toUpperCase()}</p>
          </div>
          <SwapStatusBadge status={swap.status} />
          <Link href={`/dashboard/messages/${id}`}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold font-body hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--shadow-primary)]">
            <MessageSquare size={15} /> Chat
          </Link>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <SwapTimeline status={swap.status} />
          {['CANCELLED','DISPUTED','FAILED','EXPIRED'].includes(swap.status) && swap.cancellationReason && (
            <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-body">{swap.cancellationReason}</p>
            </div>
          )}
        </div>

        {/* Platform fee */}
        {fee && fee.amount !== null && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-sm text-[var(--color-text-primary)]">Platform fee</p>
              <p className="text-xs text-[var(--color-text-secondary)] font-body mt-0.5">
                {fee.waived
                  ? 'Waived — Premium member or referral bonus'
                  : fee.paid
                  ? 'Paid, thanks!'
                  : `${fee.currency} ${fee.amount.toFixed(2)} due`}
              </p>
            </div>
            {fee.waived || fee.paid ? (
              <CheckCircle2 size={22} className="text-[var(--color-success,#10B981)]" />
            ) : (
              <button
                onClick={handlePayFee}
                disabled={isPayingFee}
                className="h-9 px-4 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold font-body hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-60"
              >
                {isPayingFee ? 'Loading…' : 'Pay'}
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: exchange + partner */}
          <div className="lg:col-span-2 space-y-5">
            {/* Exchange */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
              <h3 className="font-display font-bold text-[var(--color-text-primary)] mb-5">Exchange Summary</h3>
              <div className="grid grid-cols-3 items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl mb-2">{getCurrencyFlag(myGivesCurr)}</p>
                  <p className="font-display font-bold text-2xl text-red-600">
                    -{formatCurrency(myGivesAmt, myGivesCurr)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] font-body mt-1">You give</p>
                  {mySent && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-body">
                      <Check size={10} /> Sent
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center">
                    <ArrowLeftRight size={18} className="text-[var(--color-text-muted)]" />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] font-body text-center">
                    Rate {swap.agreedExchangeRate.toFixed(4)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl mb-2">{getCurrencyFlag(myGetsCurr)}</p>
                  <p className="font-display font-bold text-2xl text-emerald-600">
                    +{formatCurrency(myGetsAmt, myGetsCurr)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] font-body mt-1">You receive</p>
                  {myReceived && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-body">
                      <Check size={10} /> Received
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Partner */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
              <h3 className="font-display font-bold text-[var(--color-text-primary)] mb-4">Partner</h3>
              <div className="flex items-center gap-4">
                <UserAvatar name={partner.name} image={partner.image} size="lg" verified={partner.idVerified} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-lg text-[var(--color-text-primary)]">{partner.name}</p>
                    {partner.idVerified && (
                      <span className="text-xs text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded-full font-body font-semibold">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-[var(--color-text-secondary)] font-body">
                      ⭐ {formatRating(partner.rating)}
                    </span>
                    <span className="text-[var(--color-border)]">·</span>
                    <span className="text-sm text-[var(--color-text-secondary)] font-body">
                      {partner.totalSwaps} swaps
                    </span>
                    <span className="text-[var(--color-border)]">·</span>
                    <span className={cn('text-sm font-semibold font-body', trustScoreColor(partner.trustScore))}>
                      {trustScoreLabel(partner.trustScore)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirmation status */}
              <div className="mt-4 pt-4 border-t border-[var(--color-divider)]">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] font-body uppercase tracking-wide mb-1">Confirmations</p>
                <ConfirmRow label={`${isInit ? 'You' : partner.name} sent currency`} checked={mySent} />
                <ConfirmRow label={`${isInit ? partner.name : 'You'} sent currency`} checked={theirSent} />
                <ConfirmRow label={`${isInit ? 'You' : partner.name} confirmed receipt`} checked={myReceived} />
                <ConfirmRow
                  label={`${isInit ? partner.name : 'You'} confirmed receipt`}
                  checked={isInit ? swap.receiverReceivedConfirmed : swap.initiatorReceivedConfirmed}
                />
              </div>
            </div>

            {/* Meetup */}
            {swap.meetupLocation && (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
                <h3 className="font-display font-bold text-[var(--color-text-primary)] mb-4">Meetup Details</h3>
                <div className="space-y-1">
                  {swap.meetupLocation && <DetailRow label="Location" value={swap.meetupLocation} />}
                  {swap.meetupAddress  && <DetailRow label="Address"  value={swap.meetupAddress} />}
                  {swap.meetupTime     && <DetailRow label="Time"     value={formatDateTime(swap.meetupTime)} />}
                </div>
              </div>
            )}
          </div>

          {/* Right: details + actions */}
          <div className="space-y-5">
            {/* Details */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
              <h3 className="font-display font-bold text-[var(--color-text-primary)] mb-3">Details</h3>
              <DetailRow label="You are" value={isInit ? 'Initiator' : 'Receiver'} />
              <DetailRow label="Created" value={formatRelative(swap.createdAt)} />
              {swap.completedAt && <DetailRow label="Completed" value={formatRelative(swap.completedAt)} />}
              {swap.cancelledAt && <DetailRow label="Cancelled" value={formatRelative(swap.cancelledAt)} />}
            </div>

            {/* Actions */}
            {(canAccept || canSent || canReceived || canCancel || canRate) && (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] space-y-2.5">
                <h3 className="font-display font-bold text-[var(--color-text-primary)] mb-3">Actions</h3>

                {canAccept && (
                  <button
                    onClick={() => mutate(() => swapService.accept(id), 'Swap accepted!')}
                    className="w-full h-10 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold font-body hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--shadow-primary)] flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> Accept Swap
                  </button>
                )}

                {canSent && (
                  <button
                    onClick={() => mutate(() => swapService.confirmSent(id), 'Confirmed sent!')}
                    className="w-full h-10 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold font-body hover:bg-[var(--color-accent-dark)] transition-colors flex items-center justify-center gap-2">
                    <Send size={15} /> Confirm I Sent
                  </button>
                )}

                {canReceived && (
                  <button
                    onClick={() => mutate(() => swapService.confirmReceived(id), 'Receipt confirmed!')}
                    className="w-full h-10 rounded-xl bg-emerald-600 text-white text-sm font-semibold font-body hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                    <CheckCheck size={16} /> Confirm Received
                  </button>
                )}

                {canRate && (
                  <button onClick={() => setRatingOpen(true)}
                    className="w-full h-10 rounded-xl border border-[var(--color-primary)] text-[var(--color-primary)] text-sm font-semibold font-body hover:bg-[var(--color-primary-light)] transition-colors flex items-center justify-center gap-2">
                    <Star size={15} /> Rate Swap
                  </button>
                )}

                {canCancel && (
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for cancellation:')
                      if (reason) mutate(() => swapService.cancel(id, reason), 'Swap cancelled')
                    }}
                    className="w-full h-10 rounded-xl border border-red-200 text-red-600 text-sm font-semibold font-body hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                    <XCircle size={15} /> Cancel Swap
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}
