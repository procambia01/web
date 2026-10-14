'use client'
import Link from 'next/link'
import { ArrowRight, MessageSquare } from 'lucide-react'
import type { SwapDto } from '@/contracts'
import { useCurrencies } from '@/hooks/useCurrencies'
import { SwapStatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { formatRate, timeLeft, timeAgo } from '@/lib/format'

export function SwapRow({ s }: { s: SwapDto }) {
  const { money } = useCurrencies()
  const other = s.iAm === 'INITIATOR' ? s.receiver : s.initiator
  const terms = s.agreed ?? s.requested
  // The offer owner (receiver) gives `have`; the initiator receives it.
  const mineGive = s.iAm === 'INITIATOR' ? { amount: terms.wantAmount, ccy: s.wantCurrency } : { amount: terms.haveAmount, ccy: s.haveCurrency }
  const mineGet = s.iAm === 'INITIATOR' ? { amount: terms.haveAmount, ccy: s.haveCurrency } : { amount: terms.wantAmount, ccy: s.wantCurrency }
  return (
    <Link href={`/dashboard/swaps/${s.id}`} className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar name={other.name} image={other.image} verified={other.verified} />
          <div className="min-w-0"><p className="truncate font-semibold">{other.name}</p><p className="text-xs text-[var(--color-text-muted)]">{s.iAm === 'INITIATOR' ? 'You requested' : 'Requested you'} · {timeAgo(s.createdAt)}</p></div>
        </div>
        <SwapStatusBadge status={s.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 font-display text-base font-bold">
        <span>{money(mineGive.amount, mineGive.ccy)}</span><ArrowRight size={14} className="text-[var(--color-text-muted)]" /><span className="text-[var(--color-primary)]">{money(mineGet.amount, mineGet.ccy)}</span>
        <span className="font-body text-xs font-normal text-[var(--color-text-muted)]">@ {formatRate(terms.exchangeRate)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
        <span>{['PENDING', 'AGREED'].includes(s.status) ? `Expires in ${timeLeft(s.expiresAt)}` : s.cancellationReason ?? ''}</span>
        {!!s.unreadMessages && <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)]"><MessageSquare size={12} /> {s.unreadMessages} new</span>}
      </div>
    </Link>
  )
}

