'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useQueryState } from 'nuqs'
import { useState } from 'react'
import { transactionService } from '@/services'
import { DataTable, type Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { PageHeader } from '@/components/ui/page-header'
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  VERIFICATION_FEE:        'ID Verification',
  PREMIUM_SUBSCRIPTION:    'Premium Plan',
  PREMIUM_UPGRADE:         'Premium Upgrade',
  SECURITY_DEPOSIT:        'Security Deposit',
  SECURITY_DEPOSIT_REFUND: 'Deposit Refund',
  DISPUTE_FEE:             'Dispute Fee',
  FEATURED_LISTING:        'Featured Listing',
  BOOST_OFFER:             'Boost Offer',
  REFERRAL_BONUS:          'Referral Bonus',
  WITHDRAWAL:              'Withdrawal',
}

const TYPE_ICON: Record<string, string> = {
  VERIFICATION_FEE: '🛡️', PREMIUM_SUBSCRIPTION: '💎', PREMIUM_UPGRADE: '💎',
  SECURITY_DEPOSIT: '🔐', SECURITY_DEPOSIT_REFUND: '↩️',
  DISPUTE_FEE: '⚠️', FEATURED_LISTING: '📌', BOOST_OFFER: '🚀',
  REFERRAL_BONUS: '🎁', WITHDRAWAL: '💸',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  COMPLETED: 'success', PENDING: 'warning', PROCESSING: 'warning',
  FAILED: 'error', REFUNDED: 'neutral', CANCELLED: 'neutral',
}

const CREDIT_TYPES = new Set(['REFERRAL_BONUS', 'SECURITY_DEPOSIT_REFUND'])

export default function TransactionsPage() {
  const [status, setStatus] = useQueryState('status', { defaultValue: '' })
  const [page, setPage]     = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', status, page],
    queryFn:  () => transactionService.getAll({ status: status || undefined, page, perPage: 20 }),
  })

  const transactions = data?.data ?? []
  const totalSpent = transactions
    .filter(t => t.status === 'COMPLETED' && !CREDIT_TYPES.has(t.type))
    .reduce((s, t) => s + t.amount, 0)

  const columns: Column<Transaction>[] = [
    {
      key: 'type',
      header: 'Transaction',
      render: (t) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center text-xl shrink-0">
            {TYPE_ICON[t.type] ?? '💳'}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body">
              {TYPE_LABELS[t.type] ?? t.type}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] font-body">{t.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (t) => (
        <p className={cn(
          'text-sm font-bold font-body',
          CREDIT_TYPES.has(t.type) ? 'text-emerald-600' : 'text-[var(--color-text-primary)]',
        )}>
          {CREDIT_TYPES.has(t.type) ? '+' : '-'}{formatCurrency(t.amount, t.currency)}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <StatusBadge label={t.status} variant={STATUS_VARIANT[t.status] ?? 'neutral'} dot />,
    },
    {
      key: 'method',
      header: 'Method',
      render: (t) => (
        <p className="text-xs text-[var(--color-text-muted)] font-body capitalize">
          {t.paymentMethod?.replace('_', ' ') ?? '—'}
        </p>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (t) => (
        <p className="text-xs text-[var(--color-text-muted)] font-body">{formatDateTime(t.createdAt)}</p>
      ),
    },
  ]

  const statuses = ['', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-5">
      <PageHeader title="Transactions" description="Your payment history" />

      {/* Summary card */}
      {transactions.length > 0 && (
        <div
          className="rounded-2xl p-5 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1A6BFF, #0D4FCC)' }}
        >
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute right-10 -bottom-8 w-28 h-28 rounded-full bg-white/5" />
          <p className="text-blue-200/80 text-sm font-body relative z-10">Total Spent</p>
          <p className="font-display font-black text-4xl relative z-10 mt-1">{formatCurrency(totalSpent, 'USD')}</p>
          <p className="text-blue-200/60 text-xs font-body mt-1 relative z-10">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} total
          </p>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] w-fit flex-wrap">
        {statuses.map(s => (
          <button key={s || 'all'} onClick={() => { setStatus(s); setPage(1) }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold font-body capitalize transition-all',
              status === s
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        keyFn={t => t.id}
        isLoading={isLoading}
        emptyTitle="No transactions"
        emptyDesc="Your payment history will appear here"
        page={page}
        totalPages={data?.meta?.totalPages}
        total={data?.meta?.total}
        perPage={20}
        onPageChange={setPage}
      />
    </motion.div>
  )
}
