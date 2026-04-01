'use client'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, Zap, Building2, ExternalLink, Star, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/components/ui/page-header'
import { formatDate } from '@/lib/format'
import { apiPost, apiGet, type ApiResponse } from '@/lib/api'
import { cn } from '@/lib/utils'

type PlanId = 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY' | 'BUSINESS_MONTHLY' | 'BUSINESS_YEARLY'

interface Subscription {
  id: string
  planId: PlanId
  status: string
  tier: string
  interval: string
  amount: number
  currency: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

const PLANS = [
  {
    id: 'PREMIUM_MONTHLY' as PlanId,
    name: 'Premium',
    icon: Zap,
    price: '$9.99',
    interval: 'month',
    period: 'Monthly',
    trial: '7-day free trial',
    color: '#1A6BFF',
    highlight: false,
    features: [
      'Unlimited active offers',
      'Priority matching algorithm',
      'Advanced rate analytics',
      'Verified trader badge',
      'Priority 24h support',
      'Early feature access',
    ],
  },
  {
    id: 'PREMIUM_YEARLY' as PlanId,
    name: 'Premium Annual',
    icon: Zap,
    price: '$79.99',
    interval: 'year',
    period: 'Yearly · Save 33%',
    color: '#1A6BFF',
    highlight: true,
    badge: 'Best value',
    features: [
      'Everything in Premium Monthly',
      'Save $39.89 vs monthly',
      'Dedicated account manager',
      'Annual billing receipt',
    ],
  },
  {
    id: 'BUSINESS_MONTHLY' as PlanId,
    name: 'Business',
    icon: Building2,
    price: '$29.99',
    interval: 'month',
    period: 'Monthly',
    trial: '7-day free trial',
    color: '#8B5CF6',
    highlight: false,
    features: [
      'Everything in Premium',
      'Multi-currency portfolio',
      'REST API access',
      'Up to 5 team members',
      'Custom rate webhooks',
      'Bulk swap requests',
      'White-glove onboarding',
    ],
  },
  {
    id: 'BUSINESS_YEARLY' as PlanId,
    name: 'Business Annual',
    icon: Building2,
    price: '$239.99',
    interval: 'year',
    period: 'Yearly · Save 33%',
    color: '#8B5CF6',
    highlight: false,
    features: [
      'Everything in Business Monthly',
      'Save $119.89 vs monthly',
      'Dedicated relationship manager',
      'SLA guarantee 99.9%',
    ],
  },
]

export default function PremiumPage() {
  const { user }  = useAuthStore()
  const [billing, setBilling] = useState<'month' | 'year'>('month')

  const { data: subData, isLoading: subLoading, refetch } = useQuery({
    queryKey: ['subscription'],
    queryFn:  () => apiGet<Subscription | null>('/subscriptions/current'),
  })

  const sub = subData?.data

  const checkoutMutation = useMutation({
    mutationFn: (planId: PlanId) =>
      apiPost<{ url: string }>('/subscriptions/checkout', { planId }),
    onSuccess: (res) => {
      if (res.data.url) window.location.href = res.data.url
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to start checkout')
    },
  })

  const portalMutation = useMutation({
    mutationFn: () => apiPost<{ url: string }>('/subscriptions/portal'),
    onSuccess: (res) => {
      if (res.data.url) window.location.href = res.data.url
    },
    onError: () => toast.error('Failed to open billing portal'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => apiPost('/subscriptions/cancel', { immediately: false }),
    onSuccess: () => {
      toast.success('Subscription will cancel at period end')
      refetch()
    },
    onError: () => toast.error('Failed to cancel'),
  })

  const visiblePlans = PLANS.filter(p => p.interval === billing)

  const STATUS_COLOR: Record<string, string> = {
    ACTIVE:   'bg-emerald-100 text-emerald-700',
    TRIALING: 'bg-blue-100 text-blue-700',
    CANCELLED:'bg-gray-100 text-gray-600',
    PAST_DUE: 'bg-red-100 text-red-700',
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="Premium Plans"
        description="Upgrade to unlock unlimited offers, priority matching, and advanced analytics"
      />

      {/* Active subscription banner */}
      {sub && (
        <div className={cn(
          'rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center gap-4',
          sub.status === 'ACTIVE' || sub.status === 'TRIALING'
            ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)]/20'
            : 'bg-[var(--color-bg)] border-[var(--color-border)]',
        )}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-display font-bold text-[var(--color-text-primary)]">
                {sub.tier} Plan — {sub.interval === 'month' ? 'Monthly' : 'Annual'}
              </p>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', STATUS_COLOR[sub.status] ?? 'bg-gray-100 text-gray-600')}>
                {sub.status}
              </span>
              {sub.cancelAtPeriodEnd && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Cancels {formatDate(sub.currentPeriodEnd)}
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-body">
              ${sub.amount}/{sub.interval} · Next renewal {formatDate(sub.currentPeriodEnd)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold font-body text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors"
            >
              <ExternalLink size={13} /> Billing Portal
            </button>
            {!sub.cancelAtPeriodEnd && (
              <button
                onClick={() => {
                  if (!confirm('Cancel subscription at period end?')) return
                  cancelMutation.mutate()
                }}
                disabled={cancelMutation.isPending}
                className="h-9 px-4 rounded-xl border border-red-200 text-red-600 text-sm font-semibold font-body hover:bg-red-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Billing toggle */}
      {!sub && (
        <div className="flex justify-center">
          <div className="inline-flex items-center bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-1">
            {(['month', 'year'] as const).map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={cn(
                  'px-5 py-2 rounded-xl text-sm font-semibold font-body transition-all flex items-center gap-2',
                  billing === b
                    ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)]',
                )}
              >
                {b === 'month' ? 'Monthly' : 'Annual'}
                {b === 'year' && (
                  <span className="text-[10px] font-bold text-[var(--color-accent)] bg-[var(--color-accent-light)] px-1.5 py-0.5 rounded-full">
                    Save 33%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Plan cards */}
      {!sub && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {visiblePlans.map(({ id, name, icon: Icon, price, period, trial, color, highlight, badge, features }) => (
            <div
              key={id}
              className={cn(
                'relative rounded-2xl p-6 flex flex-col border transition-shadow hover:shadow-md',
                highlight
                  ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)]',
              )}
            >
              {badge && (
                <span className="absolute -top-3 left-5 bg-[var(--color-accent)] text-white text-[10px] font-bold px-3 py-1 rounded-full">
                  {badge}
                </span>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: highlight ? 'rgba(255,255,255,0.15)' : `${color}15` }}>
                  <Icon size={17} style={{ color: highlight ? '#fff' : color }} />
                </div>
                <div>
                  <p className={cn('font-display font-bold', highlight ? 'text-white' : 'text-[var(--color-text-primary)]')}>
                    {name}
                  </p>
                  <p className={cn('text-xs font-body', highlight ? 'text-white/60' : 'text-[var(--color-text-muted)]')}>
                    {period}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className={cn('font-display font-black text-2xl', highlight ? 'text-white' : 'text-[var(--color-text-primary)]')}>
                    {price}
                  </p>
                  {trial && (
                    <p className="text-[10px] font-semibold text-[var(--color-accent)] font-body mt-0.5">{trial}</p>
                  )}
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm font-body">
                    <div className={cn('w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                      highlight ? 'bg-white/20' : 'bg-[var(--color-accent-light)]')}>
                      <Check size={9} className={highlight ? 'text-white' : 'text-[var(--color-accent)]'} />
                    </div>
                    <span className={highlight ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => checkoutMutation.mutate(id)}
                disabled={checkoutMutation.isPending}
                className={cn(
                  'w-full h-11 rounded-xl font-semibold text-sm font-body transition-all flex items-center justify-center gap-2',
                  highlight
                    ? 'bg-white text-[var(--color-primary)] hover:bg-blue-50 shadow-[0_4px_20px_rgba(0,0,0,0.15)]'
                    : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-[var(--shadow-primary)]',
                  checkoutMutation.isPending && 'opacity-70 cursor-not-allowed',
                )}
              >
                {checkoutMutation.isPending ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : null}
                {trial ? 'Start free trial' : 'Upgrade now'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Free plan comparison */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Star size={16} className="text-[var(--color-text-muted)]" />
          <p className="font-display font-bold text-[var(--color-text-primary)] text-sm">
            Your current plan: Free
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-body text-[var(--color-text-muted)]">
          {['Up to 3 active offers', 'Standard matching', 'Basic analytics', 'Community support', 'In-app messaging'].map(f => (
            <div key={f} className="flex items-center gap-1.5">
              <Check size={11} className="text-[var(--color-text-muted)]" /> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Security note */}
      <p className="text-center text-xs text-[var(--color-text-muted)] font-body">
        🔒 Payments securely processed by Stripe · No card stored on SwapFX servers · Cancel anytime
      </p>
    </motion.div>
  )
}
