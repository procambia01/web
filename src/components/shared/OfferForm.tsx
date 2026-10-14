'use client'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LocateFixed } from 'lucide-react'
import toast from 'react-hot-toast'
import { createOfferSchema, updateOfferSchema, OFFER_VISIBILITIES, type CreateOfferRequest, type OfferDto, type UpdateOfferRequest } from '@/contracts'
import { api } from '@/lib/api'
import { countryOptions } from '@/lib/countries'
import { enumLabel, isoToLocalInput, localToIso } from '@/lib/format'
import { mulDecimal } from '@/lib/decimal'
import { toDecimalString, validate, type FieldErrors } from '@/lib/form'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, NativeSelect, TextArea, TextInput } from '@/components/ui/field'
import { Notice } from '@/components/ui/states'
import { CurrencySelect } from './CurrencySelect'
import { useCurrencies } from '@/hooks/useCurrencies'
import { EXAMPLE_CITIES } from '@/lib/constants'

interface SavedLocation { id: string; name: string; address: string; city: string; country: string; latitude: number; longitude: number }

const inOneHour = () => isoToLocalInput(new Date(Date.now() + 3600_000).toISOString())
const inDays = (d: number) => isoToLocalInput(new Date(Date.now() + d * 86_400_000).toISOString())

export function OfferForm({ offer, onSubmit, busy, serverErrors }: {
  offer?: OfferDto
  busy: boolean
  serverErrors?: FieldErrors
  onSubmit: (payload: CreateOfferRequest | UpdateOfferRequest) => void
}) {
  const editing = !!offer
  const { minorUnit } = useCurrencies()
  const [f, setF] = useState({
    haveCurrency: offer?.haveCurrency ?? '', wantCurrency: offer?.wantCurrency ?? '',
    haveAmount: offer?.haveAmount ?? '', exchangeRate: offer?.exchangeRate ?? '', minSwapAmount: offer?.minSwapAmount ?? '',
    country: offer?.area.country ?? '', city: offer?.area.city ?? '', meetingArea: offer?.area.label ?? '',
    latitude: '', longitude: '', radiusKm: String(offer?.area.radiusKm ?? 5),
    availableFrom: offer ? isoToLocalInput(offer.availableFrom) : inOneHour(), availableUntil: offer ? isoToLocalInput(offer.availableUntil) : inDays(7),
    notes: offer?.notes ?? '', visibility: offer?.visibility ?? 'PUBLIC', requiresVerifiedUsers: offer?.requiresVerifiedUsers ?? false, minTrustScore: String(offer?.minTrustScore ?? 0),
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))
  const countries = useMemo(countryOptions, [])
  const saved = useQuery({ queryKey: ['saved-locations'], queryFn: () => api.get<SavedLocation[]>('/users/me/locations'), enabled: !editing })
  const refRate = useQuery({
    queryKey: ['rate', f.haveCurrency, f.wantCurrency],
    queryFn: () => api.get<{ rate: string; asOf: string }>(`/rates/${f.haveCurrency}/${f.wantCurrency}`),
    enabled: !editing && !!f.haveCurrency && !!f.wantCurrency && f.haveCurrency !== f.wantCurrency,
    retry: false,
  })

  useEffect(() => { if (serverErrors) setErrors((p) => ({ ...p, ...serverErrors })) }, [serverErrors])

  const wantPreview = mulDecimal(toDecimalString(f.haveAmount) ?? '', toDecimalString(f.exchangeRate) ?? refRate.data?.rate ?? '', minorUnit(f.wantCurrency))

  function locate() {
    if (!navigator.geolocation) return toast.error('Location is not available in this browser')
    navigator.geolocation.getCurrentPosition(
      (p) => { set('latitude', p.coords.latitude.toFixed(5)); set('longitude', p.coords.longitude.toFixed(5)) },
      () => toast.error('We could not get your location. Choose a saved place or enter coordinates.'),
      { timeout: 10_000 },
    )
  }
  function useSaved(id: string) {
    const s = saved.data?.find((x) => x.id === id)
    if (!s) return
    setF((p) => ({ ...p, city: s.city, country: s.country, latitude: String(s.latitude), longitude: String(s.longitude), meetingArea: p.meetingArea || s.name }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const dec = (v: string) => toDecimalString(v) ?? v.trim()
    if (editing) {
      const { data, errors: errs } = validate(updateOfferSchema, {
        exchangeRate: f.exchangeRate ? dec(f.exchangeRate) : undefined, minSwapAmount: f.minSwapAmount ? dec(f.minSwapAmount) : undefined,
        meetingArea: f.meetingArea || undefined, availableFrom: localToIso(f.availableFrom), availableUntil: localToIso(f.availableUntil),
        notes: f.notes || undefined, visibility: f.visibility, requiresVerifiedUsers: f.requiresVerifiedUsers, minTrustScore: Number(f.minTrustScore) || 0, radiusKm: Number(f.radiusKm) || 5,
      })
      setErrors(errs)
      if (data) onSubmit(data)
      return
    }
    const { data, errors: errs } = validate(createOfferSchema, {
      haveCurrency: f.haveCurrency, wantCurrency: f.wantCurrency, haveAmount: dec(f.haveAmount),
      exchangeRate: f.exchangeRate ? dec(f.exchangeRate) : undefined, minSwapAmount: f.minSwapAmount ? dec(f.minSwapAmount) : undefined,
      country: f.country, city: f.city, meetingArea: f.meetingArea || undefined,
      latitude: f.latitude === '' ? NaN : Number(f.latitude), longitude: f.longitude === '' ? NaN : Number(f.longitude), radiusKm: Number(f.radiusKm) || 5,
      availableFrom: localToIso(f.availableFrom), availableUntil: localToIso(f.availableUntil), timeSlots: [],
      notes: f.notes || undefined, visibility: f.visibility, requiresVerifiedUsers: f.requiresVerifiedUsers, minTrustScore: Number(f.minTrustScore) || 0,
    })
    if (errs.latitude || errs.longitude) errs.latitude = 'Set your location so people nearby can find the offer'
    setErrors(errs)
    if (data) onSubmit(data)
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <section className="space-y-4">
        <h2 className="text-base">What are you exchanging?</h2>
        {editing && <Notice tone="info">Currencies and the total amount can&apos;t be changed after posting, so existing swaps stay accurate. Post a new offer if you need different ones.</Notice>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="I have" error={errors.haveCurrency} htmlFor="have"><CurrencySelect id="have" value={f.haveCurrency} onChange={(v) => set('haveCurrency', v)} exclude={f.wantCurrency} invalid={!!errors.haveCurrency} /></Field>
          <Field label="I want" error={errors.wantCurrency} htmlFor="want"><CurrencySelect id="want" value={f.wantCurrency} onChange={(v) => set('wantCurrency', v)} exclude={f.haveCurrency} invalid={!!errors.wantCurrency} /></Field>
          <Field label="Amount I have" error={errors.haveAmount} htmlFor="amount"><TextInput id="amount" inputMode="decimal" value={f.haveAmount} onChange={(e) => set('haveAmount', e.target.value)} disabled={editing} invalid={!!errors.haveAmount} placeholder="1000" /></Field>
          <Field label="Smallest swap I'll accept" error={errors.minSwapAmount} hint="Optional" htmlFor="min"><TextInput id="min" inputMode="decimal" value={f.minSwapAmount} onChange={(e) => set('minSwapAmount', e.target.value)} /></Field>
          <Field label={`Rate (1 ${f.haveCurrency || 'have'} = ? ${f.wantCurrency || 'want'})`} error={errors.exchangeRate} htmlFor="rate"
            hint={refRate.data ? `Market reference: ${refRate.data.rate}. Leave blank to use it.` : 'Leave blank to use the market reference rate.'}>
            <TextInput id="rate" inputMode="decimal" value={f.exchangeRate} onChange={(e) => set('exchangeRate', e.target.value)} invalid={!!errors.exchangeRate} placeholder={refRate.data?.rate} />
          </Field>
          <div className="flex items-end"><p className="rounded-xl bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)]">{wantPreview ? <>You&apos;d receive about <strong className="text-[var(--color-text-primary)]">{wantPreview} {f.wantCurrency}</strong></> : 'Enter an amount to preview'}</p></div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base">Where can you meet?</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">Others see only the city and a rounded area — never your exact position.</p>
        {!editing && (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={locate}><LocateFixed size={14} /> Use my current location</Button>
            {(saved.data?.length ?? 0) > 0 && (
              <NativeSelect className="w-auto" defaultValue="" onChange={(e) => useSaved(e.target.value)} aria-label="Use a saved place">
                <option value="">Or choose a saved place…</option>
                {saved.data!.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
              </NativeSelect>
            )}
            {f.latitude && f.longitude && <span className="text-xs text-[var(--color-success-text)]">Location set ✓</span>}
          </div>
        )}
        {errors.latitude && <p role="alert" className="text-xs text-[var(--color-error)]">{errors.latitude}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Country" error={errors.country} htmlFor="country">
            <NativeSelect id="country" value={f.country} onChange={(e) => set('country', e.target.value)} disabled={editing} invalid={!!errors.country}>
              <option value="">Select…</option>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </NativeSelect>
          </Field>
          <Field label="City" error={errors.city} htmlFor="city"><TextInput id="city" value={f.city} onChange={(e) => set('city', e.target.value)} disabled={editing} invalid={!!errors.city} placeholder={EXAMPLE_CITIES[0]} /></Field>
          <Field label="Area name (optional)" error={errors.meetingArea} htmlFor="area" hint="e.g. a district or station"><TextInput id="area" value={f.meetingArea} onChange={(e) => set('meetingArea', e.target.value)} /></Field>
          <Field label="Travel radius (km)" error={errors.radiusKm} htmlFor="radius"><TextInput id="radius" type="number" min={1} max={100} value={f.radiusKm} onChange={(e) => set('radiusKm', e.target.value)} /></Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base">When and who?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Available from" error={errors.availableFrom} htmlFor="from"><TextInput id="from" type="datetime-local" value={f.availableFrom} onChange={(e) => set('availableFrom', e.target.value)} /></Field>
          <Field label="Available until" error={errors.availableUntil} htmlFor="until" hint="The offer stops being shown the moment this passes."><TextInput id="until" type="datetime-local" value={f.availableUntil} onChange={(e) => set('availableUntil', e.target.value)} /></Field>
          <Field label="Who can see it" htmlFor="vis">
            <NativeSelect id="vis" value={f.visibility} onChange={(e) => set('visibility', e.target.value as typeof f.visibility)}>
              {OFFER_VISIBILITIES.map((v) => <option key={v} value={v}>{enumLabel(v)}</option>)}
            </NativeSelect>
          </Field>
          <Field label="Minimum trust score (0–100)" error={errors.minTrustScore} htmlFor="trust"><TextInput id="trust" type="number" min={0} max={100} value={f.minTrustScore} onChange={(e) => set('minTrustScore', e.target.value)} /></Field>
        </div>
        <Checkbox checked={f.requiresVerifiedUsers} onChange={(v) => set('requiresVerifiedUsers', v)}>Only identity-verified members can request this offer</Checkbox>
        <Field label="Notes (optional)" error={errors.notes} htmlFor="notes"><TextArea id="notes" value={f.notes} onChange={(e) => set('notes', e.target.value)} maxLength={500} placeholder="Preferred meeting places, denominations…" /></Field>
      </section>

      <Button type="submit" size="lg" className="h-10 px-6" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish offer'}</Button>
    </form>
  )
}
