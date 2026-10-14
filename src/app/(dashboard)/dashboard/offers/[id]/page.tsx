'use client'
import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Clock, MapPin, Pause, Pencil, Play, Rocket, ShieldCheck, Star, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { OfferDto, SwapDto } from '@/contracts'
import { ApiError, api, errorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useCurrencies } from '@/hooks/useCurrencies'
import { formatDateTime, formatRate, timeLeft, flagEmoji } from '@/lib/format'
import { countryName } from '@/lib/countries'
import { gteDecimal, mulDecimal } from '@/lib/decimal'
import { toDecimalString } from '@/lib/form'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, TextArea, TextInput } from '@/components/ui/field'
import { ErrorState, Notice, PageLoader } from '@/components/ui/states'
import { OfferStatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { TrustBadges } from '@/components/shared/TrustBadges'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PromoteOfferDialog } from '@/components/shared/PurchaseDialog'
import { PageHeader } from '@/components/ui/page-header'

function RequestSwap({ offer }: { offer: OfferDto }) {
  const router = useRouter()
  const { money, minorUnit } = useCurrencies()
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const dec = toDecimalString(amount)
  const wantAmount = dec ? mulDecimal(dec, offer.exchangeRate, minorUnit(offer.wantCurrency)) : null
  const tooMuch = !!dec && !gteDecimal(offer.availableAmount, dec)
  const tooLittle = !!dec && !gteDecimal(dec, offer.minSwapAmount)
  const m = useMutation({
    mutationFn: () => api.post<SwapDto>('/swaps', { offerId: offer.id, haveAmount: dec, message: message.trim() || undefined }),
    onSuccess: (s) => { toast.success('Request sent'); router.push(`/dashboard/swaps/${s.id}`) },
    onError: (e) => setError(errorMessage(e)),
  })
  return (
    <Card>
      <CardHeader><CardTitle>Request this swap</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Field label={`How much ${offer.haveCurrency} do you want?`} error={tooMuch ? `Only ${money(offer.availableAmount, offer.haveCurrency)} is available` : tooLittle ? `Minimum is ${money(offer.minSwapAmount, offer.haveCurrency)}` : undefined}
          hint={`Available: ${money(offer.availableAmount, offer.haveCurrency)}`}>
          <TextInput inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value); setError('') }} placeholder={offer.minSwapAmount} />
        </Field>
        {wantAmount && !tooMuch && (
          <div className="rounded-xl bg-[var(--color-bg)] p-3 text-sm">
            You&apos;d give <strong>{money(wantAmount, offer.wantCurrency)}</strong> and receive <strong>{money(dec!, offer.haveCurrency)}</strong> at 1 {offer.haveCurrency} = {formatRate(offer.exchangeRate)} {offer.wantCurrency}.
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">The server re-checks this calculation. The amount is set aside on the offer once you request, but no money moves through CashMouver.</p>
          </div>
        )}
        <Field label="Message (optional)"><TextArea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="Hi! When would suit you?" /></Field>
        {error && <Notice tone="error">{error}</Notice>}
        <Button className="h-10 w-full" disabled={!dec || tooMuch || tooLittle || m.isPending} onClick={() => { setError(''); m.mutate() }}>{m.isPending ? 'Sending…' : 'Send request'}</Button>
      </CardContent>
    </Card>
  )
}

export default function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const { money } = useCurrencies()
  const [promo, setPromo] = useState<null | 'BOOST' | 'FEATURED'>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const q = useQuery({ queryKey: ['offer', id], queryFn: () => api.get<OfferDto>(`/offers/${id}`) })
  const toggle = useMutation({
    mutationFn: (pause: boolean) => api.post<OfferDto>(`/offers/${id}/${pause ? 'pause' : 'resume'}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['offer', id] }); void qc.invalidateQueries({ queryKey: ['offers'] }) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (q.isLoading) return <PageLoader />
  if (q.error || !q.data) {
    const notFound = q.error instanceof ApiError && q.error.status === 404
    return <ErrorState error={notFound ? new Error('This offer is no longer available.') : q.error} onRetry={notFound ? undefined : () => q.refetch()} />
  }
  const o = q.data
  const mine = !!o.mine || o.owner.id === me?.id
  const live = o.status === 'ACTIVE'

  return (
    <div>
      <PageHeader
        title={`${o.haveCurrency} → ${o.wantCurrency}`}
        description={`Posted by ${o.owner.name}`}
        actions={mine ? (
          <>
            <Link href={`/dashboard/offers/${o.id}/edit`} className={buttonVariants({ variant: 'outline' })}><Pencil size={14} /> Edit</Link>
            {(o.status === 'ACTIVE' || o.status === 'PAUSED') && (
              <Button variant="outline" disabled={toggle.isPending} onClick={() => toggle.mutate(o.status === 'ACTIVE')}>{o.status === 'ACTIVE' ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}</Button>
            )}
            {(o.status === 'ACTIVE' || o.status === 'PAUSED') && <Button variant="destructive" onClick={() => setCancelOpen(true)}><Trash2 size={14} /> Cancel</Button>}
          </>
        ) : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 font-display text-2xl font-bold"><span>{money(o.availableAmount, o.haveCurrency)}</span><ArrowRight className="text-[var(--color-text-muted)]" /><span className="text-[var(--color-primary)]">{money(o.availableWantAmount, o.wantCurrency)}</span></div>
                <div className="flex items-center gap-2">{o.isFeatured && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">Featured</span>}{o.isBoosted && <span className="rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-primary)]">Boosted</span>}{mine && <OfferStatusBadge status={o.status} />}</div>
              </div>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-[var(--color-text-muted)]">Rate</dt><dd className="font-semibold">1 {o.haveCurrency} = {formatRate(o.exchangeRate)} {o.wantCurrency}</dd></div>
                <div><dt className="text-[var(--color-text-muted)]">Original size</dt><dd className="font-semibold">{money(o.haveAmount, o.haveCurrency)}</dd></div>
                <div><dt className="text-[var(--color-text-muted)]">Currently reserved by swaps</dt><dd className="font-semibold">{money(o.reservedAmount, o.haveCurrency)}</dd></div>
                <div><dt className="text-[var(--color-text-muted)]">Smallest swap</dt><dd className="font-semibold">{money(o.minSwapAmount, o.haveCurrency)}</dd></div>
                <div className="flex items-start gap-1.5"><MapPin size={14} className="mt-0.5 text-[var(--color-text-muted)]" /><div><dt className="text-[var(--color-text-muted)]">Area</dt><dd className="font-semibold">{o.area.label ? `${o.area.label}, ` : ''}{o.area.city}, {flagEmoji(o.area.country)} {countryName(o.area.country)}</dd><dd className="text-xs text-[var(--color-text-muted)]">Within ~{o.area.radiusKm} km · exact spot agreed privately</dd></div></div>
                <div className="flex items-start gap-1.5"><Clock size={14} className="mt-0.5 text-[var(--color-text-muted)]" /><div><dt className="text-[var(--color-text-muted)]">Available</dt><dd className="font-semibold">{formatDateTime(o.availableFrom)} → {formatDateTime(o.availableUntil)}</dd><dd className="text-xs text-[var(--color-text-muted)]">{timeLeft(o.availableUntil)} left</dd></div></div>
              </dl>
              {o.notes && <p className="rounded-xl bg-[var(--color-bg)] p-3 text-sm">{o.notes}</p>}
              {(o.requiresVerifiedUsers || o.minTrustScore > 0) && <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]"><ShieldCheck size={13} /> Requires {o.requiresVerifiedUsers ? 'identity verification' : ''}{o.requiresVerifiedUsers && o.minTrustScore > 0 ? ' and ' : ''}{o.minTrustScore > 0 ? `a trust score of ${o.minTrustScore}+` : ''}</p>}
            </CardContent>
          </Card>

          {mine && (
            <Card>
              <CardHeader><CardTitle>Promote this offer</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--color-border)] p-4">
                    <p className="flex items-center gap-2 font-semibold"><Rocket size={16} className="text-[var(--color-primary)]" /> Boost</p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Rank higher in search results.{o.boostedUntil && ` Active until ${formatDateTime(o.boostedUntil)}.`}</p>
                    <Button className="mt-3" variant="outline" disabled={!live} onClick={() => setPromo('BOOST')}>{o.isBoosted ? 'Extend boost' : 'Boost offer'}</Button>
                  </div>
                  <div className="rounded-xl border border-[var(--color-border)] p-4">
                    <p className="flex items-center gap-2 font-semibold"><Star size={16} className="text-amber-500" /> Featured</p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Show in premium placements.{o.featuredUntil && ` Active until ${formatDateTime(o.featuredUntil)}.`}</p>
                    <Button className="mt-3" variant="outline" disabled={!live} onClick={() => setPromo('FEATURED')}>{o.isFeatured ? 'Extend featured' : 'Feature offer'}</Button>
                  </div>
                </div>
                {!live && <p className="text-xs text-[var(--color-text-muted)]">Only active offers can be promoted.</p>}
                <p className="text-xs text-[var(--color-text-muted)]">Payment is confirmed by our server after Stripe tells us it succeeded; the badge appears once that happens. Views: {o.viewCount}.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <UserAvatar name={o.owner.name} image={o.owner.image} size="lg" verified={o.owner.verified} />
                <div><Link href={`/dashboard/members/${o.owner.id}`} className="font-semibold hover:underline">{o.owner.name}</Link><p className="text-xs text-[var(--color-text-muted)]">{[o.owner.city, o.owner.country && countryName(o.owner.country)].filter(Boolean).join(', ')}</p></div>
              </div>
              <TrustBadges user={o.owner} />
              <dl className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                <div className="rounded-lg bg-[var(--color-bg)] p-2"><dd className="font-display text-base font-bold">{o.owner.trustScore}</dd><dt className="text-[var(--color-text-muted)]">Trust</dt></div>
                <div className="rounded-lg bg-[var(--color-bg)] p-2"><dd className="font-display text-base font-bold">{Math.round(o.owner.completionRate * 100)}%</dd><dt className="text-[var(--color-text-muted)]">Completed</dt></div>
                <div className="rounded-lg bg-[var(--color-bg)] p-2"><dd className="font-display text-base font-bold">{o.owner.successfulSwaps}</dd><dt className="text-[var(--color-text-muted)]">Swaps</dt></div>
              </dl>
            </CardContent>
          </Card>
          {!mine && live && <RequestSwap offer={o} />}
          {!mine && !live && <Notice tone="warning">This offer is {o.status.toLowerCase()} and can&apos;t be requested.</Notice>}
        </div>
      </div>

      {promo && <PromoteOfferDialog offerId={o.id} kind={promo} open onOpenChange={(v) => !v && setPromo(null)} />}
      <ConfirmDialog open={cancelOpen} onOpenChange={setCancelOpen} destructive title="Cancel this offer?" description="Pending requests on it will be declined. Agreed swaps are not affected." confirmLabel="Cancel offer"
        onConfirm={async () => { await api.del(`/offers/${id}`); void qc.invalidateQueries({ queryKey: ['offers'] }); toast.success('Offer cancelled'); router.push('/dashboard/offers') }} />
    </div>
  )
}
