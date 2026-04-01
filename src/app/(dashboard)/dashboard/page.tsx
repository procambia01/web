'use client'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftRight, TrendingUp, CheckCircle2, Star,
  Plus, Search, ArrowRight, Loader2, RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { offerService, swapService } from '@/services'
import { StatCard } from '@/components/ui/stat-card'
import {
  formatCurrency, formatRelative, formatRating,
  getCurrencyFlag, trustScoreLabel, trustScoreColor,
  initials,
} from '@/lib/format'
import { SWAP_STATUS_COLORS, OFFER_STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { SwapOffer, Swap } from '@/types'

// ── Mock chart data (replace with real analytics endpoint) ──
const swapVolumeData = [
  { month: 'Oct', volume: 12400, swaps: 34 },
  { month: 'Nov', volume: 18200, swaps: 51 },
  { month: 'Dec', volume: 15800, swaps: 44 },
  { month: 'Jan', volume: 24600, swaps: 68 },
  { month: 'Feb', volume: 21200, swaps: 59 },
  { month: 'Mar', volume: 31500, swaps: 87 },
]

const rateData = [
  { day: 'Mon', usd: 1580, eur: 1710 },
  { day: 'Tue', usd: 1592, eur: 1725 },
  { day: 'Wed', usd: 1575, eur: 1698 },
  { day: 'Thu', usd: 1610, eur: 1740 },
  { day: 'Fri', usd: 1598, eur: 1728 },
  { day: 'Sat', usd: 1622, eur: 1755 },
  { day: 'Sun', usd: 1615, eur: 1748 },
]

// ── Reusable section header ───────────────────────────────
function SectionHeader({ title, href, action }: { title: string; href: string; action?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display font-bold text-[var(--color-text-primary)] text-lg">{title}</h2>
      <Link href={href} className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline font-body">
        {action ?? 'View all'} <ArrowRight size={13} />
      </Link>
    </div>
  )
}

// ── Offer row ────────────────────────────────────────────
function OfferRow({ offer }: { offer: SwapOffer }) {
  const statusCls = OFFER_STATUS_COLORS[offer.status] ?? 'bg-gray-100 text-gray-600'
  return (
    <Link
      href={`/dashboard/offers/${offer.id}`}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--color-bg)] transition-colors group"
    >
      <div className="flex items-center gap-1 text-2xl">
        <span>{getCurrencyFlag(offer.haveCurrency)}</span>
        <ArrowRight size={12} className="text-[var(--color-text-muted)]" />
        <span>{getCurrencyFlag(offer.wantCurrency)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[var(--color-text-primary)] font-body">
          {formatCurrency(offer.haveAmount, offer.haveCurrency)} → {formatCurrency(offer.wantAmount, offer.wantCurrency)}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">
          {offer.city} · {formatRelative(offer.createdAt)}
        </p>
      </div>
      <span className={cn('text-[10px] font-bold uppercase px-2 py-1 rounded-full font-body tracking-wide', statusCls)}>
        {offer.status}
      </span>
      <ArrowRight size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all" />
    </Link>
  )
}

// ── Swap row ─────────────────────────────────────────────
function SwapRow({ swap, userId }: { swap: Swap; userId: string }) {
  const isInit  = swap.initiatorId === userId
  const partner = isInit ? swap.receiver : swap.initiator
  const myCurr  = isInit ? swap.initiatorGivesCurrency : swap.receiverGivesCurrency
  const myAmt   = isInit ? swap.initiatorGivesAmount : swap.receiverGivesAmount
  const statusCls = SWAP_STATUS_COLORS[swap.status] ?? 'bg-gray-100 text-gray-600'

  return (
    <Link
      href={`/dashboard/swaps/${swap.id}`}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--color-bg)] transition-colors group"
    >
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-xs font-bold shrink-0">
        {initials(partner.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[var(--color-text-primary)] font-body">{partner.name}</p>
        <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">
          {formatCurrency(myAmt, myCurr)} · {formatRelative(swap.createdAt)}
        </p>
      </div>
      <span className={cn('text-[10px] font-bold uppercase px-2 py-1 rounded-full font-body tracking-wide whitespace-nowrap', statusCls)}>
        {swap.status.replace('_', ' ')}
      </span>
      <ArrowRight size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all" />
    </Link>
  )
}

// ── Custom tooltip ────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 shadow-[var(--shadow-md)] font-body text-xs">
      <p className="font-semibold text-[var(--color-text-primary)] mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value.toLocaleString()}</span></p>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: myOffers, isLoading: offersLoading } = useQuery({
    queryKey: ['my-offers'],
    queryFn:  () => offerService.getMyOffers({ perPage: 5 }),
  })

  const { data: mySwaps, isLoading: swapsLoading } = useQuery({
    queryKey: ['my-swaps'],
    queryFn:  () => swapService.getMySwaps({ perPage: 5 }),
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const stagger = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Welcome banner */}
      <motion.div variants={stagger}
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #1A6BFF 0%, #0D4FCC 50%, #00C896 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute right-16 -bottom-12 w-36 h-36 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-100/80 text-sm font-body">{greeting} 👋</p>
            <h2 className="font-display font-bold text-2xl mt-1">{user?.name?.split(' ')[0] ?? 'Trader'}</h2>
            <p className="text-blue-100/70 text-sm font-body mt-1">
              You have{' '}
              <span className="text-white font-semibold">
                {mySwaps?.data?.filter(s => ['PENDING','AGREED','IN_PROGRESS'].includes(s.status)).length ?? 0}
              </span>
              {' '}active swap{mySwaps?.data?.filter(s => ['PENDING','AGREED','IN_PROGRESS'].includes(s.status)).length !== 1 ? 's' : ''} in progress
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/dashboard/offers/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[var(--color-primary)] font-semibold text-sm font-body hover:bg-blue-50 transition-colors shadow-sm">
              <Plus size={16} /> New Offer
            </Link>
            <Link href="/dashboard/offers?tab=explore"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm font-body hover:bg-white/20 transition-colors">
              <Search size={16} /> Explore
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Swaps"
          value={user ? '—' : '0'}
          change={12.5}
          icon={ArrowLeftRight}
          iconColor="text-[var(--color-primary)]"
          iconBg="bg-[var(--color-primary-light)]"
        />
        <StatCard
          label="Completed"
          value="0"
          change={8.2}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Rating"
          value={formatRating(0)}
          icon={Star}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Trust Score"
          value="New"
          icon={TrendingUp}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          gradient
        />
      </motion.div>

      {/* Charts row */}
      <motion.div variants={stagger} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Volume chart */}
        <div className="lg:col-span-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-[var(--color-text-primary)]">Swap Volume</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">Last 6 months</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold font-body bg-emerald-50 px-2 py-1 rounded-full">
              ↑ 24.3% <span className="text-[var(--color-text-muted)] font-normal ml-1">vs last period</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={swapVolumeData}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1A6BFF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1A6BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="volume" name="Volume ($)" stroke="#1A6BFF" strokeWidth={2} fill="url(#volGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Rate chart */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
          <div className="mb-5">
            <h3 className="font-display font-bold text-[var(--color-text-primary)]">NGN Rates</h3>
            <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">USD & EUR this week</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rateData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="usd" name="USD/NGN" fill="#1A6BFF" radius={[4,4,0,0]} />
              <Bar dataKey="eur" name="EUR/NGN" fill="#00C896" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent offers + swaps */}
      <motion.div variants={stagger} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Offers */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] overflow-hidden">
          <div className="p-5 pb-0">
            <SectionHeader title="My Offers" href="/dashboard/offers" action="View all" />
          </div>
          {offersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-[var(--color-text-muted)]" />
            </div>
          ) : myOffers?.data?.length ? (
            <div className="divide-y divide-[var(--color-divider)]">
              {myOffers.data.slice(0, 4).map(o => <OfferRow key={o.id} offer={o} />)}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-[var(--color-text-muted)] font-body">No offers yet</p>
              <Link href="/dashboard/offers/create"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline font-body">
                <Plus size={13} /> Create your first offer
              </Link>
            </div>
          )}
        </div>

        {/* Recent Swaps */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] overflow-hidden">
          <div className="p-5 pb-0">
            <SectionHeader title="Recent Swaps" href="/dashboard/swaps" />
          </div>
          {swapsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-[var(--color-text-muted)]" />
            </div>
          ) : mySwaps?.data?.length ? (
            <div className="divide-y divide-[var(--color-divider)]">
              {mySwaps.data.slice(0, 4).map(s => <SwapRow key={s.id} swap={s} userId={user?.id ?? ''} />)}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-[var(--color-text-muted)] font-body">No swaps yet</p>
              <Link href="/dashboard/offers?tab=explore"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline font-body">
                <Search size={13} /> Explore offers
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* Exchange rate ticker */}
      <motion.div variants={stagger}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-[var(--color-text-primary)]">Live Exchange Rates</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] pulse-dot" />
            <span className="text-xs text-[var(--color-text-muted)] font-body">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { pair: 'USD/NGN', rate: '1,615', change: '+0.8%', up: true },
            { pair: 'EUR/NGN', rate: '1,748', change: '+1.2%', up: true },
            { pair: 'GBP/NGN', rate: '2,012', change: '-0.3%', up: false },
            { pair: 'USD/GHS', rate: '14.20', change: '+0.4%', up: true },
            { pair: 'EUR/USD', rate: '1.082', change: '-0.1%', up: false },
          ].map(({ pair, rate, change, up }) => (
            <div key={pair} className="rounded-xl bg-[var(--color-bg)] p-3 border border-[var(--color-border)]">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] font-body">{pair}</p>
              <p className="font-display font-bold text-[var(--color-text-primary)] text-lg mt-0.5">{rate}</p>
              <p className={cn('text-[11px] font-semibold font-body mt-0.5', up ? 'text-emerald-600' : 'text-red-500')}>
                {change}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
