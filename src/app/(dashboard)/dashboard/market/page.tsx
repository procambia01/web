'use client'
import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { LocateFixed, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import type { AdDto, OfferDto } from '@/contracts'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, NativeSelect, TextInput } from '@/components/ui/field'
import { CardSkeletons, EmptyState, ErrorState } from '@/components/ui/states'
import { CurrencySelect } from '@/components/shared/CurrencySelect'
import { OfferCard } from '@/components/shared/OfferCard'
import { Pager } from '@/components/shared/Pager'
import { SponsoredTag } from '@/components/shared/TrustBadges'
import { toDecimalString } from '@/lib/form'

export default function MarketPage() {
  const [f, setF] = useState({ haveCurrency: '', wantCurrency: '', city: '', minAmount: '', maxAmount: '', verifiedOnly: false, availableNow: false, sortBy: 'relevance', radiusKm: '25' })
  const [pos, setPos] = useState<{ latitude: number; longitude: number } | null>(null)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const params = {
    page, perPage: 18, sortBy: f.sortBy === 'distance' && !pos ? 'relevance' : f.sortBy,
    haveCurrency: f.haveCurrency, wantCurrency: f.wantCurrency, city: f.city,
    minAmount: toDecimalString(f.minAmount) ?? undefined, maxAmount: toDecimalString(f.maxAmount) ?? undefined,
    verifiedOnly: f.verifiedOnly || undefined, availableNow: f.availableNow || undefined,
    ...(pos ? { latitude: pos.latitude, longitude: pos.longitude, radiusKm: Number(f.radiusKm) } : {}),
  }
  const offers = useQuery({ queryKey: ['offers', params], queryFn: () => api.page<OfferDto>('/offers', params), placeholderData: keepPreviousData })
  const featured = useQuery({
    queryKey: ['featured', f.haveCurrency, f.wantCurrency],
    queryFn: () => api.get<OfferDto[]>('/offers/featured', { placement: 'MARKETPLACE_TOP', have: f.haveCurrency, want: f.wantCurrency }),
  })
  const ads = useQuery({ queryKey: ['ads', 'MARKETPLACE', f.haveCurrency], queryFn: () => api.get<AdDto[]>('/ads', { placement: 'MARKETPLACE', currency: f.haveCurrency || undefined }) })

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((p) => ({ ...p, [k]: v })); setPage(1) }

  function locate() {
    if (!navigator.geolocation) return toast.error('Location is not available in this browser')
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ latitude: p.coords.latitude, longitude: p.coords.longitude }); setPage(1) },
      () => toast.error('We could not get your location. You can still search by city.'),
      { maximumAge: 300_000, timeout: 10_000 },
    )
  }

  return (
    <div>
      <PageHeader title="Find offers" description="People offering to exchange cash currencies near you." actions={<Button variant="outline" onClick={() => setShowFilters((s) => !s)}><SlidersHorizontal size={14} /> Filters</Button>} />

      <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="They have"><CurrencySelect value={f.haveCurrency} onChange={(v) => set('haveCurrency', v)} includeAny /></Field>
        <Field label="They want"><CurrencySelect value={f.wantCurrency} onChange={(v) => set('wantCurrency', v)} includeAny /></Field>
        <Field label="City"><TextInput value={f.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Berlin" /></Field>
        <Field label="Sort by">
          <NativeSelect value={f.sortBy} onChange={(e) => set('sortBy', e.target.value)}>
            <option value="relevance">Best match</option><option value="rate">Best rate</option><option value="distance">Nearest</option><option value="newest">Newest</option><option value="amount">Largest amount</option>
          </NativeSelect>
        </Field>
        {showFilters && (
          <>
            <Field label="Min amount"><TextInput inputMode="decimal" value={f.minAmount} onChange={(e) => set('minAmount', e.target.value)} /></Field>
            <Field label="Max amount"><TextInput inputMode="decimal" value={f.maxAmount} onChange={(e) => set('maxAmount', e.target.value)} /></Field>
            <Field label="Search radius (km)"><NativeSelect value={f.radiusKm} onChange={(e) => set('radiusKm', e.target.value)} disabled={!pos}>{['5', '10', '25', '50', '100'].map((r) => <option key={r} value={r}>{r} km</option>)}</NativeSelect></Field>
            <div className="flex flex-col justify-end gap-2">
              <Checkbox checked={f.verifiedOnly} onChange={(v) => set('verifiedOnly', v)}>Verified members only</Checkbox>
              <Checkbox checked={f.availableNow} onChange={(v) => set('availableNow', v)}>Available now</Checkbox>
            </div>
          </>
        )}
        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
          <Button variant={pos ? 'default' : 'outline'} onClick={pos ? () => setPos(null) : locate}><LocateFixed size={14} /> {pos ? 'Near me · on' : 'Use my location'}</Button>
          <p className="text-xs text-[var(--color-text-muted)]">Your position is used only to rank results and is never shown to others.</p>
        </div>
      </div>

      {(featured.data?.length ?? 0) > 0 && (
        <section className="mt-8" aria-label="Featured offers">
          <h2 className="mb-3 text-base">Featured</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{featured.data!.slice(0, 3).map((o) => <OfferCard key={o.id} offer={o} />)}</div>
        </section>
      )}

      {(ads.data?.length ?? 0) > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {ads.data!.slice(0, 2).map((a) => (
            <a key={a.id} href={a.targetUrl ?? (a.offerId ? `/dashboard/offers/${a.offerId}` : '#')} target={a.targetUrl ? '_blank' : undefined} rel="noopener noreferrer sponsored"
              onClick={() => void api.post(`/ads/${a.id}/click`).catch(() => undefined)}
              className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-center justify-between"><p className="font-semibold">{a.title}</p><SponsoredTag /></div>
              {a.body && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{a.body}</p>}
            </a>
          ))}
        </div>
      )}

      <section className="mt-8" aria-label="Offers" aria-busy={offers.isFetching}>
        {offers.isLoading ? <CardSkeletons count={6} /> : offers.error ? <ErrorState error={offers.error} onRetry={() => offers.refetch()} /> :
          offers.data!.items.length === 0 ? <EmptyState title="No offers match" description="Try widening your search, or post your own offer so others can find you." /> : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{offers.data!.items.map((o) => <OfferCard key={o.id} offer={o} />)}</div>
              <Pager meta={offers.data!.meta} onPage={setPage} />
            </>
          )}
      </section>
    </div>
  )
}
