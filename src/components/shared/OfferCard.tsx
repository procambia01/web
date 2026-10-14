'use client'
import Link from 'next/link'
import { ArrowRight, Clock, MapPin, Rocket, Star } from 'lucide-react'
import type { OfferDto } from '@/contracts'
import { useCurrencies } from '@/hooks/useCurrencies'
import { formatRate, timeLeft, flagEmoji } from '@/lib/format'
import { OfferStatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { TrustBadges, SponsoredTag } from './TrustBadges'
import { api } from '@/lib/api'

export function OfferCard({ offer, href }: { offer: OfferDto; href?: string }) {
  const { money } = useCurrencies()
  const to = href ?? `/dashboard/offers/${offer.id}`
  const track = () => {
    if (offer.isFeatured) void api.post(`/promotions/featured/${offer.id}/click`).catch(() => undefined)
    else if (offer.isBoosted) void api.post(`/promotions/boost/${offer.id}/click`).catch(() => undefined)
  }
  return (
    <Link href={to} onClick={track} className="group block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar name={offer.owner.name} image={offer.owner.image} size="md" verified={offer.owner.verified} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{offer.owner.name}</p>
            <p className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]"><Star size={11} className="fill-amber-400 text-amber-400" />{offer.owner.totalSwaps > 0 ? `${offer.owner.rating.toFixed(1)} · ${offer.owner.totalSwaps} swaps` : 'New member'}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {offer.sponsored && <SponsoredTag />}
          {offer.isFeatured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-400"><Star size={10} /> Featured</span>}
          {offer.isBoosted && !offer.isFeatured && <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-primary)]"><Rocket size={10} /> Boosted</span>}
          {offer.mine && <OfferStatusBadge status={offer.status} />}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 font-display">
        <span className="text-lg font-bold">{money(offer.availableAmount, offer.haveCurrency)}</span>
        <ArrowRight size={16} className="text-[var(--color-text-muted)]" />
        <span className="text-lg font-bold text-[var(--color-primary)]">{offer.wantCurrency}</span>
      </div>
      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">1 {offer.haveCurrency} = <strong>{formatRate(offer.exchangeRate)}</strong> {offer.wantCurrency} · worth {money(offer.availableWantAmount, offer.wantCurrency)}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
        <span className="inline-flex items-center gap-1"><MapPin size={12} />{flagEmoji(offer.area.country)} {offer.area.city}{offer.distanceKm !== undefined && ` · ~${offer.distanceKm} km`}</span>
        <span className="inline-flex items-center gap-1"><Clock size={12} />{timeLeft(offer.availableUntil)} left</span>
      </div>
      <div className="mt-3"><TrustBadges user={offer.owner} showRating={false} /></div>
    </Link>
  )
}
