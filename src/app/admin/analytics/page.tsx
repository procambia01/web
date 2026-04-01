'use client'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { TrendingUp, Users, ArrowLeftRight, DollarSign } from 'lucide-react'

const monthlyRevenue = [
  { month: 'Oct', revenue: 3200,  fees: 420  },
  { month: 'Nov', revenue: 4800,  fees: 640  },
  { month: 'Dec', revenue: 4100,  fees: 545  },
  { month: 'Jan', revenue: 6700,  fees: 890  },
  { month: 'Feb', revenue: 5900,  fees: 785  },
  { month: 'Mar', revenue: 9200,  fees: 1220 },
]

const userRetention = [
  { week: 'W1', d1: 100, d7: 72, d30: 48 },
  { week: 'W2', d1: 100, d7: 68, d30: 44 },
  { week: 'W3', d1: 100, d7: 74, d30: 51 },
  { week: 'W4', d1: 100, d7: 71, d30: 47 },
  { week: 'W5', d1: 100, d7: 76, d30: 53 },
  { week: 'W6', d1: 100, d7: 78, d30: 55 },
]

const topCurrencies = [
  { pair: 'USD/NGN', volume: 48200, swaps: 312 },
  { pair: 'EUR/NGN', volume: 31800, swaps: 204 },
  { pair: 'GBP/NGN', volume: 22600, swaps: 145 },
  { pair: 'USD/GHS', volume: 18400, swaps: 118 },
  { pair: 'USD/EUR', volume: 15200, swaps: 97  },
]

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 shadow-[var(--shadow-md)] font-body text-xs">
      <p className="font-semibold text-[var(--color-text-primary)] mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{typeof p.value === 'number' && p.value > 999 ? `$${p.value.toLocaleString()}` : `${p.value}${p.name.includes('%') || p.name.includes('d') ? '%' : ''}`}</span></p>
      ))}
    </div>
  )
}

const Card = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
    <h3 className="font-display font-bold text-[var(--color-text-primary)]">{title}</h3>
    {subtitle && <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5 mb-4">{subtitle}</p>}
    {!subtitle && <div className="mb-4" />}
    {children}
  </div>
)

export default function AdminAnalyticsPage() {
  const stagger = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div initial="hidden" animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      className="max-w-7xl mx-auto space-y-6">
      <motion.div variants={stagger}>
        <PageHeader title="Analytics" description="Platform performance and trends" />
      </motion.div>

      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="MRR" value="$9,200" change={31.2} icon={DollarSign} iconColor="text-emerald-600" iconBg="bg-emerald-50" gradient />
        <StatCard label="New Users (MTD)" value="2,100" change={18.4} icon={Users} iconColor="text-[var(--color-primary)]" iconBg="bg-[var(--color-primary-light)]" />
        <StatCard label="Swap Volume" value="$312K" change={24.8} icon={ArrowLeftRight} iconColor="text-violet-600" iconBg="bg-violet-50" />
        <StatCard label="Avg. Rate Margin" value="1.42%" change={0.3} icon={TrendingUp} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </motion.div>

      <motion.div variants={stagger} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Revenue vs Fees" subtitle="Monthly breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1A6BFF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1A6BFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00C896" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-body)' }} />
              <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#1A6BFF" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              <Area type="monotone" dataKey="fees"    name="Fees ($)"    stroke="#00C896" strokeWidth={2} fill="url(#feeGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="User Retention" subtitle="Day 1 / Day 7 / Day 30">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={userRetention}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-body)' }} />
              <Line type="monotone" dataKey="d1"  name="Day 1 (%)"  stroke="#1A6BFF" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="d7"  name="Day 7 (%)"  stroke="#00C896" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="d30" name="Day 30 (%)" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      <motion.div variants={stagger}>
        <Card title="Top Currency Pairs" subtitle="By trading volume this month">
          <div className="space-y-3">
            {topCurrencies.map(({ pair, volume, swaps }, i) => {
              const maxVol = topCurrencies[0].volume
              const pct    = (volume / maxVol) * 100
              return (
                <div key={pair} className="flex items-center gap-4">
                  <span className="w-5 text-xs font-bold text-[var(--color-text-muted)] font-body text-right">{i + 1}</span>
                  <span className="w-20 text-sm font-semibold text-[var(--color-text-primary)] font-body">{pair}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-sm font-semibold text-[var(--color-text-primary)] font-body">
                    ${volume.toLocaleString()}
                  </span>
                  <span className="w-16 text-right text-xs text-[var(--color-text-muted)] font-body">{swaps} swaps</span>
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
