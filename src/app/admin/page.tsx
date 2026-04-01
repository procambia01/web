'use client'
import { useQuery } from '@tanstack/react-query'
import {
  Users, ArrowLeftRight, CheckCircle2, AlertTriangle,
  DollarSign, ShieldCheck, TrendingUp, Activity,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { adminService } from '@/services'
import { StatCard } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { formatNumber, formatCurrency, formatRelative } from '@/lib/format'
import { SWAP_STATUS_COLORS } from '@/lib/constants'
import { SwapStatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Mock data — replace with real analytics endpoints
const userGrowthData = [
  { month: 'Oct', users: 820,  active: 610  },
  { month: 'Nov', users: 1140, active: 870  },
  { month: 'Dec', users: 980,  active: 740  },
  { month: 'Jan', users: 1560, active: 1200 },
  { month: 'Feb', users: 1320, active: 980  },
  { month: 'Mar', users: 2100, active: 1650 },
]

const swapStatusDist = [
  { name: 'Completed', value: 63, color: '#00C896' },
  { name: 'Active',    value: 22, color: '#1A6BFF' },
  { name: 'Cancelled', value: 10, color: '#9CA3AF' },
  { name: 'Disputed',  value: 5,  color: '#EF4444' },
]

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

export default function AdminPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  adminService.getStats,
  })

  const { data: recentSwaps } = useQuery({
    queryKey: ['admin-swaps-recent'],
    queryFn:  () => adminService.getSwaps({ perPage: 6, page: 1 }),
  })

  const { data: recentUsers } = useQuery({
    queryKey: ['admin-users-recent'],
    queryFn:  () => adminService.getUsers({ perPage: 5, page: 1, sort: 'createdAt:desc' }),
  })

  const s = stats?.data

  const stagger = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div initial="hidden" animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      className="max-w-7xl mx-auto space-y-6">
      <motion.div variants={stagger}>
        <PageHeader title="Admin Overview" description="Platform health at a glance" />
      </motion.div>

      {/* KPI Grid */}
      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"    value={isLoading ? '—' : formatNumber(s?.totalUsers    ?? 0, 0)} change={18.4} icon={Users}         iconColor="text-[var(--color-primary)]"  iconBg="bg-[var(--color-primary-light)]" />
        <StatCard label="Total Swaps"    value={isLoading ? '—' : formatNumber(s?.totalSwaps    ?? 0, 0)} change={24.1} icon={ArrowLeftRight} iconColor="text-violet-600" iconBg="bg-violet-50" />
        <StatCard label="Completed"      value={isLoading ? '—' : formatNumber(s?.completedSwaps?? 0, 0)} change={15.2} icon={CheckCircle2}  iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard label="Open Disputes"  value={isLoading ? '—' : formatNumber(s?.openDisputes  ?? 0, 0)} change={-8.3}  icon={AlertTriangle} iconColor="text-red-600"   iconBg="bg-red-50" />
      </motion.div>

      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue"          value={isLoading ? '—' : formatCurrency(s?.revenue         ?? 0, 'USD')} change={31.0} icon={DollarSign}   iconColor="text-amber-600"  iconBg="bg-amber-50" gradient />
        <StatCard label="Active Users"     value={isLoading ? '—' : formatNumber(s?.activeUsers      ?? 0, 0)} change={12.7} icon={Activity}     iconColor="text-cyan-600"   iconBg="bg-cyan-50" />
        <StatCard label="Pending Verif."   value={isLoading ? '—' : formatNumber(s?.pendingVerifications??0, 0)} icon={ShieldCheck}  iconColor="text-indigo-600" iconBg="bg-indigo-50" />
        <StatCard label="Total Volume"     value={isLoading ? '—' : formatCurrency(s?.totalVolume     ?? 0, 'USD')} change={28.5} icon={TrendingUp}   iconColor="text-pink-600"   iconBg="bg-pink-50" />
      </motion.div>

      {/* Charts */}
      <motion.div variants={stagger} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User growth */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-[var(--color-text-primary)]">User Growth</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">Total vs active users</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-body">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-[var(--color-primary)] inline-block" /> Total</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-[var(--color-accent)] inline-block" /> Active</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={userGrowthData}>
              <defs>
                <linearGradient id="totGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1A6BFF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1A6BFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00C896" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="users"  name="Total"  stroke="#1A6BFF" strokeWidth={2} fill="url(#totGrad)" dot={false} />
              <Area type="monotone" dataKey="active" name="Active" stroke="#00C896" strokeWidth={2} fill="url(#actGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Swap status distribution */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
          <h3 className="font-display font-bold text-[var(--color-text-primary)] mb-1">Swap Distribution</h3>
          <p className="text-xs text-[var(--color-text-muted)] font-body mb-4">By status</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={swapStatusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {swapStatusDist.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {swapStatusDist.map(({ name, value, color }) => (
              <div key={name} className="flex items-center justify-between text-xs font-body">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[var(--color-text-secondary)]">{name}</span>
                </div>
                <span className="font-semibold text-[var(--color-text-primary)]">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recent tables */}
      <motion.div variants={stagger} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent swaps */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
            <h3 className="font-display font-bold text-[var(--color-text-primary)]">Recent Swaps</h3>
            <Link href="/admin/swaps" className="text-xs text-[var(--color-primary)] font-semibold hover:underline font-body">View all</Link>
          </div>
          <div className="divide-y divide-[var(--color-divider)]">
            {(recentSwaps?.data ?? []).slice(0, 5).map(s => (
              <Link key={s.id} href={`/admin/swaps/${s.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-bg)] transition-colors group">
                <UserAvatar name={s.initiator.name} image={s.initiator.image} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body truncate">
                    {s.initiator.name} ↔ {s.receiver.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">{formatRelative(s.createdAt)}</p>
                </div>
                <SwapStatusBadge status={s.status} />
              </Link>
            ))}
            {!recentSwaps?.data?.length && (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)] font-body">No swaps yet</p>
            )}
          </div>
        </div>

        {/* New users */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
            <h3 className="font-display font-bold text-[var(--color-text-primary)]">New Users</h3>
            <Link href="/admin/users" className="text-xs text-[var(--color-primary)] font-semibold hover:underline font-body">View all</Link>
          </div>
          <div className="divide-y divide-[var(--color-divider)]">
            {(recentUsers?.data ?? []).map(u => (
              <Link key={u.id} href={`/admin/users/${u.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-bg)] transition-colors group">
                <UserAvatar name={u.name} image={u.image} size="sm" verified={u.idVerified} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body truncate">{u.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)] font-body truncate">{u.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--color-text-muted)] font-body">{formatRelative(u.createdAt)}</p>
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-wide font-body',
                    u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
                  )}>
                    {u.role}
                  </span>
                </div>
              </Link>
            ))}
            {!recentUsers?.data?.length && (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)] font-body">No users yet</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
