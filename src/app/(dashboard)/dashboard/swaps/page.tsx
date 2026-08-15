'use client'
import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { Search, ArrowRight, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { swapService } from '@/services'
import { DataTable, type Column } from '@/components/ui/data-table'
import { SwapStatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { PageHeader } from '@/components/ui/page-header'
import { getCurrencyFlag, formatCurrency, formatRelative, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import type { Swap } from '@/types'

const TABS = [
  { key: 'all',       label: 'All'       },
  { key: 'active',    label: 'Active'    },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const ACTIVE = ['PENDING', 'AGREED', 'IN_PROGRESS', 'CONFIRMING']

function SwapsPageContent() {
  const { user }              = useAuthStore()
  const [tab, setTab]         = useQueryState('tab', { defaultValue: 'all' })
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)

  const statusParam =
    tab === 'active'    ? ACTIVE.join(',') :
    tab === 'completed' ? 'COMPLETED' :
    tab === 'cancelled' ? 'CANCELLED,FAILED,EXPIRED' :
    undefined

  const { data, isLoading } = useQuery({
    queryKey: ['my-swaps', tab, page],
    queryFn:  () => swapService.getMySwaps({ status: statusParam, page, perPage: 20 }),
  })

  const filtered = (data?.data ?? []).filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    const partner = s.initiatorId === user?.id ? s.receiver : s.initiator
    return partner.name.toLowerCase().includes(q) ||
      s.initiatorGivesCurrency.toLowerCase().includes(q) ||
      s.receiverGivesCurrency.toLowerCase().includes(q)
  })

  const columns: Column<Swap>[] = [
    {
      key: 'partner',
      header: 'Partner',
      render: (s) => {
        const isInit  = s.initiatorId === user?.id
        const partner = isInit ? s.receiver : s.initiator
        return (
          <div className="flex items-center gap-3">
            <UserAvatar name={partner.name} image={partner.image} size="sm" verified={partner.idVerified} />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body">{partner.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] font-body">{isInit ? 'Initiated' : 'Received'}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'exchange',
      header: 'Exchange',
      render: (s) => {
        const isInit = s.initiatorId === user?.id
        const myCurr = isInit ? s.initiatorGivesCurrency : s.receiverGivesCurrency
        const myAmt  = isInit ? s.initiatorGivesAmount   : s.receiverGivesAmount
        const getCurr= isInit ? s.receiverGivesCurrency  : s.initiatorGivesCurrency
        const getAmt = isInit ? s.receiverGivesAmount    : s.initiatorGivesAmount
        return (
          <div className="flex items-center gap-2 text-sm font-body">
            <span className="text-red-600 font-semibold">-{formatCurrency(myAmt, myCurr)}</span>
            <ArrowRight size={12} className="text-[var(--color-text-muted)]" />
            <span className="text-emerald-600 font-semibold">+{formatCurrency(getAmt, getCurr)}</span>
          </div>
        )
      },
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (s) => (
        <p className="text-xs text-[var(--color-text-secondary)] font-body">
          {s.agreedExchangeRate.toFixed(4)}
        </p>
      ),
    },
    {
      key: 'meetup',
      header: 'Meetup',
      render: (s) => (
        <p className="text-xs text-[var(--color-text-muted)] font-body">
          {s.meetupTime ? formatDateTime(s.meetupTime) : '—'}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <SwapStatusBadge status={s.status} />,
    },
    {
      key: 'created',
      header: 'Created',
      render: (s) => (
        <p className="text-xs text-[var(--color-text-muted)] font-body">{formatRelative(s.createdAt)}</p>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (s) => (
        <div className="flex items-center gap-1 justify-end">
          <Link href={`/dashboard/swaps/${s.id}`}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
            title="View">
            <ArrowRight size={14} />
          </Link>
          {!['COMPLETED','CANCELLED','FAILED','EXPIRED'].includes(s.status) && (
            <Link href={`/dashboard/messages/${s.id}`}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Chat">
              <MessageSquare size={14} />
            </Link>
          )}
        </div>
      ),
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-5">
      <PageHeader
        title="My Swaps"
        description="Track and manage your currency exchanges"
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by partner or currency…"
          className="w-full h-9 pl-9 pr-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-body text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1) }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold font-body capitalize transition-all',
              tab === t.key ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}>
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyFn={s => s.id}
        isLoading={isLoading}
        emptyTitle="No swaps found"
        emptyDesc="Your swap history will appear here"
        page={page}
        totalPages={data?.meta?.totalPages}
        total={data?.meta?.total}
        perPage={20}
        onPageChange={setPage}
      />
    </motion.div>
  )
}

export default function SwapsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
        </div>
      }
    >
      <SwapsPageContent />
    </Suspense>
  )
}
