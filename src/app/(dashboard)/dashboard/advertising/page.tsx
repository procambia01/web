'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adCampaignSchema, type OwnerAdDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { startCheckout } from '@/lib/checkout'
import { validate } from '@/lib/form'
import { enumLabel, formatDate } from '@/lib/format'
import { useProducts } from '@/hooks/usePlan'
import { useCurrencies } from '@/hooks/useCurrencies'
import { Button } from '@/components/ui/button'
import { Field, NativeSelect, TextArea, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState, ErrorState, Notice, PageLoader } from '@/components/ui/states'

const AD_TYPES = ['SPONSORED_OFFER', 'SPONSORED_BUSINESS', 'FEATURED_PARTNER'] as const
const PLACEMENTS = ['HOMEPAGE', 'MARKETPLACE'] as const
const csv = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)

interface Form { id?: string; type: string; placement: string; title: string; body: string; imageUrl: string; targetUrl: string; offerId: string; currencies: string; countries: string; cities: string }
const blank: Form = { type: 'SPONSORED_BUSINESS', placement: 'MARKETPLACE', title: '', body: '', imageUrl: '', targetUrl: '', offerId: '', currencies: '', countries: '', cities: '' }

export default function AdvertisingPage() {
  const qc = useQueryClient()
  const { money } = useCurrencies()
  const products = useProducts('ADVERTISING')
  const ads = useQuery({ queryKey: ['my-ads'], queryFn: () => api.get<OwnerAdDto[]>('/advertising') })
  const [f, setF] = useState<Form | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [product, setProduct] = useState('')
  const [paying, setPaying] = useState<string | null>(null)
  const set = (k: keyof Form, v: string) => setF((x) => (x ? { ...x, [k]: v } : x))

  const save = useMutation({
    mutationFn: ({ id, body }: { id?: string; body: unknown }) => (id ? api.put<OwnerAdDto>(`/advertising/${id}`, body) : api.post<OwnerAdDto>('/advertising', body)),
    onSuccess: () => { toast.success('Campaign saved'); setF(null); void qc.invalidateQueries({ queryKey: ['my-ads'] }) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!f) return
    const raw = {
      type: f.type, placement: f.placement, title: f.title, body: f.body || undefined, imageUrl: f.imageUrl || undefined, targetUrl: f.targetUrl || undefined,
      offerId: f.offerId || undefined, currencies: csv(f.currencies).map((c) => c.toUpperCase()), countries: csv(f.countries).map((c) => c.toUpperCase()), cities: csv(f.cities),
    }
    const { data, errors } = validate(adCampaignSchema, raw)
    setErrors(errors)
    if (data) save.mutate({ id: f.id, body: data })
  }
  async function pay(ad: OwnerAdDto) {
    const code = product || products.data?.[0]?.code
    if (!code) return toast.error('No advertising product is available')
    setPaying(ad.id)
    try { await startCheckout('advertising', { productCode: code, campaignId: ad.id }) } catch (e) { toast.error(errorMessage(e)); setPaying(null) }
  }
  const editable = (s: string) => ['DRAFT', 'PENDING_PAYMENT', 'REJECTED'].includes(s)

  return (
    <div>
      <PageHeader title="Advertising" description="Promote an offer or your business. All ads are reviewed and always labelled “Sponsored”."
        actions={!f && <Button onClick={() => { setF(blank); setErrors({}) }}>New campaign</Button>} />
      <Notice tone="info" className="mb-6">Ads are a CashMouver service. They never affect how swaps are matched or who you trade with.</Notice>

      {f && (
        <form onSubmit={submit} className="mb-8 space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type"><NativeSelect value={f.type} onChange={(e) => set('type', e.target.value)}>{AD_TYPES.map((t) => <option key={t} value={t}>{enumLabel(t)}</option>)}</NativeSelect></Field>
            <Field label="Placement"><NativeSelect value={f.placement} onChange={(e) => set('placement', e.target.value)}>{PLACEMENTS.map((t) => <option key={t} value={t}>{enumLabel(t)}</option>)}</NativeSelect></Field>
          </div>
          <Field label="Headline" error={errors.title}><TextInput value={f.title} maxLength={80} onChange={(e) => set('title', e.target.value)} invalid={!!errors.title} /></Field>
          <Field label="Text" error={errors.body}><TextArea value={f.body} maxLength={200} onChange={(e) => set('body', e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Image URL (https)" error={errors.imageUrl}><TextInput value={f.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} invalid={!!errors.imageUrl} /></Field>
            <Field label="Link URL (https)" error={errors.targetUrl}><TextInput value={f.targetUrl} onChange={(e) => set('targetUrl', e.target.value)} invalid={!!errors.targetUrl} /></Field>
          </div>
          {f.type === 'SPONSORED_OFFER' && <Field label="Offer ID" error={errors.offerId} hint="Open your offer and copy its ID from the address bar."><TextInput value={f.offerId} onChange={(e) => set('offerId', e.target.value)} invalid={!!errors.offerId} /></Field>}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Currencies" hint="e.g. EUR, USD" error={errors.currencies}><TextInput value={f.currencies} onChange={(e) => set('currencies', e.target.value)} /></Field>
            <Field label="Countries" hint="e.g. FR, DE" error={errors.countries}><TextInput value={f.countries} onChange={(e) => set('countries', e.target.value)} /></Field>
            <Field label="Cities" hint="e.g. Paris, Berlin"><TextInput value={f.cities} onChange={(e) => set('cities', e.target.value)} /></Field>
          </div>
          <div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save campaign'}</Button><Button type="button" variant="ghost" onClick={() => setF(null)}>Cancel</Button></div>
        </form>
      )}

      {(products.data?.length ?? 0) > 1 && (
        <Field label="Package to purchase" className="mb-4 max-w-sm">
          <NativeSelect value={product || products.data![0].code} onChange={(e) => setProduct(e.target.value)}>{products.data!.map((p) => <option key={p.code} value={p.code}>{p.name} — {money(p.amount, p.currency)}</option>)}</NativeSelect>
        </Field>
      )}

      {ads.isLoading ? <PageLoader /> : ads.error ? <ErrorState error={ads.error} onRetry={() => ads.refetch()} /> : !ads.data?.length ? <EmptyState title="No campaigns yet" description="Create your first campaign." /> : (
        <ul className="space-y-3">
          {ads.data.map((a) => (
            <li key={a.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.title} <StatusBadge label={enumLabel(a.status)} variant={a.status === 'ACTIVE' ? 'success' : a.status === 'REJECTED' ? 'error' : 'neutral'} /></p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{enumLabel(a.type)} · {enumLabel(a.placement)}{a.startsAt && ` · ${formatDate(a.startsAt)} – ${formatDate(a.endsAt)}`} · {a.impressions} views · {a.clicks} clicks</p>
                  {a.reviewNote && <p className="mt-1 text-sm text-amber-700">Reviewer: {a.reviewNote}</p>}
                </div>
                <div className="flex gap-2">
                  {editable(a.status) && <Button size="sm" variant="outline" onClick={() => { setErrors({}); setF({ id: a.id, type: a.type, placement: a.placement, title: a.title, body: a.body ?? '', imageUrl: a.imageUrl ?? '', targetUrl: a.targetUrl ?? '', offerId: a.offerId ?? '', currencies: a.currencies.join(', '), countries: a.countries.join(', '), cities: a.cities.join(', ') }) }}>Edit</Button>}
                  {['DRAFT', 'PENDING_PAYMENT'].includes(a.status) && <Button size="sm" disabled={paying === a.id} onClick={() => pay(a)}>{paying === a.id ? 'Redirecting…' : 'Pay & submit'}</Button>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
