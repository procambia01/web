'use client'
import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { Plus, Search, Filter, Eye, Pencil, Trash2, Pause, Play, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { offerService } from '@/services'
import { DataTable, type Column } from '@/components/ui/data-table'
import { OfferStatusBadge } from '@/components/ui/status-badge'
import { PageHeader } from '@/components/ui/page-header'
import { getCurrencyFlag, formatCurrency, formatRelative, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { SwapOffer } from '@/types'

const TABS = ['all', 'active', 'matched', 'completed', 'paused', 'expired'] as const
type Tab = typeof TABS[number]

function OffersPageContent() {
  const [tab, setTab]         = useQueryState('tab', { defaultValue: 'all' })
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-offers', tab, page],
    queryFn: () => offerService.getMyOffers({
      status: tab === 'all' ? undefined : tab.toUpperCase(),
      page,
      perPage: 20,
    }),
  })

  const filtered = (data?.data ?? []).filter(o =>
    !search ||
    o.haveCurrency.toLowerCase().includes(search.toLowerCase()) ||
    o.wantCurrency.toLowerCase().includes(search.toLowerCase()) ||
    o.city.toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this offer?')) return
    try {
      await offerService.delete(id)
      toast.success('Offer deleted')
      refetch()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleTogglePause = async (offer: SwapOffer) => {
    try {
      if (offer.status === 'PAUSED') {
        await offerService.resume(offer.id)
        toast.success('Offer resumed')
      } else {
        await offerService.pause(offer.id)
        toast.success('Offer paused')
      }
      refetch()
    } catch {
      toast.error('Action failed')
    }
  }

  const columns: Column<SwapOffer>[] = [
    {
      key: 'pair',
      header: 'Currency Pair',
      render: (o) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xl">
            <span>{getCurrencyFlag(o.haveCurrency)}</span>
            <ArrowRight size={12} className="text-[var(--color-text-muted)]" />
            <span>{getCurrencyFlag(o.wantCurrency)}</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-[var(--color-text-primary)] font-body">
              {o.haveCurrency} → {o.wantCurrency}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] font-body">{o.city}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Offering',
      render: (o) => (
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body">
            {formatCurrency(o.haveAmount, o.haveCurrency)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] font-body">
            Rate: {o.exchangeRate.toFixed(4)}
          </p>
        </div>
      ),
    },
    {
      key: 'want',
      header: 'Wanting',
      render: (o) => (
        <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body">
          {formatCurrency(o.wantAmount, o.wantCurrency)}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <OfferStatusBadge status={o.status} />,
    },
    {
      key: 'views',
      header: 'Views / Matches',
      render: (o) => (
        <p className="text-sm text-[var(--color-text-secondary)] font-body">
          {formatNumber(o.viewCount, 0)} / {formatNumber(o.matchCount, 0)}
        </p>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (o) => (
        <p className="text-xs text-[var(--color-text-muted)] font-body">{formatRelative(o.createdAt)}</p>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (o) => (
        <div className="flex items-center gap-1 justify-end">
          <Link
            href={`/dashboard/offers/${o.id}`}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
            title="View"
          >
            <Eye size={14} />
          </Link>
          <Link
            href={`/dashboard/offers/${o.id}/edit`}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </Link>
          {(o.status === 'ACTIVE' || o.status === 'PAUSED') && (
            <button
              onClick={() => handleTogglePause(o)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
              title={o.status === 'PAUSED' ? 'Resume' : 'Pause'}
            >
              {o.status === 'PAUSED' ? <Play size={14} /> : <Pause size={14} />}
            </button>
          )}
          <button
            onClick={() => handleDelete(o.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-5">
      <PageHeader
        title="My Offers"
        description="Manage your currency exchange offers"
        actions={
          <Link
            href="/dashboard/offers/create"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold font-body hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--shadow-primary)]"
          >
            <Plus size={16} /> New Offer
          </Link>
        }
      />

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by currency or city…"
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-body text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1) }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold font-body capitalize transition-all',
              tab === t
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyFn={o => o.id}
        isLoading={isLoading}
        emptyTitle="No offers found"
        emptyDesc="Create your first offer to get started"
        emptyAction={
          <Link href="/dashboard/offers/create"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-primary)] font-semibold hover:underline font-body">
            <Plus size={13} /> Create offer
          </Link>
        }
        page={page}
        totalPages={data?.meta?.totalPages}
        total={data?.meta?.total}
        perPage={20}
        onPageChange={setPage}
      />
    </motion.div>
  )
}

export default function OffersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
        </div>
      }
    >
      <OffersPageContent />
    </Suspense>
  )
}
