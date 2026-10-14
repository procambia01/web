import { BadgeCheck, Building2, Crown, Star } from 'lucide-react'
import type { TrustSummaryDto } from '@/contracts'

export function TrustBadges({ user, showRating = true }: { user: TrustSummaryDto; showRating?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {user.verified && (
        <span title="Identity verified" className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-primary)]">
          <BadgeCheck size={11} /> Verified
        </span>
      )}
      {user.businessVerified && (
        <span title="Verified business" className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-light)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-accent-dark)]">
          <Building2 size={11} /> Business
        </span>
      )}
      {user.premiumBadge && (
        <span title="Premium member" className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-400">
          <Crown size={11} /> Premium
        </span>
      )}
      {showRating && user.totalSwaps > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
          <Star size={12} className="fill-amber-400 text-amber-400" /> {user.rating.toFixed(1)} · {user.totalSwaps} swaps
        </span>
      )}
    </span>
  )
}

export function SponsoredTag() {
  return <span className="rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Sponsored</span>
}
