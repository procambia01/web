'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftRight, Bell, MessageSquare, Tag } from 'lucide-react'
import type { OfferDto, SwapDto } from '@/contracts'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useUnread } from '@/hooks/useUnread'
import { useEntitlements } from '@/hooks/usePlan'
import { formatDateTime } from '@/lib/format'
import { buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Notice, Skeleton } from '@/components/ui/states'
import { OfferCard } from '@/components/shared/OfferCard'
import { SwapRow } from '@/components/shared/SwapRow'

export default function DashboardHome() {
  const me = useAuthStore((s) => s.user)!
  const unread = useUnread()
  const ent = useEntitlements()
  const active = useQuery({ queryKey: ['swaps', 'ACTIVE', 1, 'home'], queryFn: () => api.page<SwapDto>('/swaps', { status: 'ACTIVE', page: 1, perPage: 4 }) })
  const requests = useQuery({ queryKey: ['swaps', 'PENDING', 1, 'home'], queryFn: () => api.page<SwapDto>('/swaps', { status: 'PENDING', page: 1, perPage: 4 }) })
  const featured = useQuery({ queryKey: ['featured', 'HOMEPAGE'], queryFn: () => api.get<OfferDto[]>('/offers/featured', { placement: 'HOMEPAGE' }) })
  const activity = useQuery({ queryKey: ['activity', 'home'], queryFn: () => api.page<{ id: string; description: string; createdAt: string }>('/users/me/activity', { page: 1, perPage: 5 }) })

  const todo: { text: string; href: string }[] = []
  if (!me.emailVerified) todo.push({ text: 'Verify your email to start trading', href: '/dashboard/settings' })
  if (!me.phoneVerified) todo.push({ text: 'Verify your phone number to raise your limits', href: '/dashboard/settings' })
  if (me.verificationTier === 'NONE') todo.push({ text: 'Verify your identity to build trust', href: '/dashboard/verification' })
  if (!me.country || !me.city) todo.push({ text: 'Add your city so we can show nearby offers', href: '/dashboard/profile' })

  return (
    <div>
      <PageHeader title={`Welcome, ${me.name.split(' ')[0]}`} description="Your swaps, offers and messages at a glance."
        actions={<><Link href="/dashboard/market" className={buttonVariants({ variant: 'outline' })}>Find offers</Link><Link href="/dashboard/offers/new" className={buttonVariants()}>Post an offer</Link></>} />

      {todo.length > 0 && (
        <Notice tone="info" className="mb-6">
          <p className="mb-1 font-semibold">Finish setting up</p>
          <ul className="list-inside list-disc">{todo.map((t) => <li key={t.text}><Link className="underline" href={t.href}>{t.text}</Link></li>)}</ul>
        </Notice>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active swaps" value={ent.data ? `${ent.data.usage.activeSwaps}` : '—'} icon={ArrowLeftRight} />
        <StatCard label="Active offers" value={ent.data ? `${ent.data.usage.activeOffers} / ${ent.data.limits.maxActiveOffers}` : '—'} icon={Tag} />
        <StatCard label="Unread messages" value={unread.messages} icon={MessageSquare} />
        <StatCard label="Unread notifications" value={unread.notifications} icon={Bell} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg">Requests for you</h2><Link className="text-sm underline" href="/dashboard/swaps">All swaps</Link></div>
          {requests.isLoading ? <Skeleton className="h-28" /> : (requests.data?.items.length ?? 0) === 0 ? <p className="text-sm text-[var(--color-text-secondary)]">No pending requests.</p> :
            <div className="space-y-3">{requests.data!.items.map((s) => <SwapRow key={s.id} s={s} />)}</div>}
        </section>
        <section>
          <h2 className="mb-3 text-lg">In progress</h2>
          {active.isLoading ? <Skeleton className="h-28" /> : (active.data?.items.length ?? 0) === 0 ? <p className="text-sm text-[var(--color-text-secondary)]">No swaps in progress.</p> :
            <div className="space-y-3">{active.data!.items.map((s) => <SwapRow key={s.id} s={s} />)}</div>}
        </section>
      </div>

      {(featured.data?.length ?? 0) > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg">Featured offers</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{featured.data!.slice(0, 3).map((o) => <OfferCard key={o.id} offer={o} />)}</div>
        </section>
      )}

      {(activity.data?.items.length ?? 0) > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg">Recent activity</h2>
          <ul className="space-y-1 text-sm">{activity.data!.items.map((a) => <li key={a.id} className="flex justify-between border-b border-[var(--color-border)] py-1.5"><span>{a.description}</span><span className="text-[var(--color-text-muted)]">{formatDateTime(a.createdAt)}</span></li>)}</ul>
        </section>
      )}
    </div>
  )
}
