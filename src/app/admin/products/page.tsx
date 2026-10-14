'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { BILLING_INTERVALS, FEATURED_PLACEMENTS, PLAN_TIERS, PRODUCT_KINDS, type ServiceProductDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { decimalToMinor, minorToDecimal } from '@/lib/minor'
import { useCurrencies } from '@/hooks/useCurrencies'
import { enumLabel } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, NativeSelect, TextArea, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ErrorState, Notice } from '@/components/ui/states'
import { CurrencySelect } from '@/components/shared/CurrencySelect'

type Row = ServiceProductDto & { id: string; amountMinor: number; isActive: boolean; sortOrder: number }
const blank = { code: '', kind: 'BOOST', name: '', description: '', amount: '', currency: 'EUR', interval: 'ONE_TIME', durationHours: '', planTier: '', placement: '', trialDays: '0', features: '', isActive: true, sortOrder: '100', reason: '' }

export default function AdminProducts() {
  const qc = useQueryClient()
  const { money, minorUnit } = useCurrencies()
  const q = useQuery({ queryKey: ['admin', 'products'], queryFn: () => api.get<Row[]>('/admin/products') })
  const [f, setF] = useState<typeof blank | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [isEdit, setIsEdit] = useState(false)
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['admin', 'products'] }); void qc.invalidateQueries({ queryKey: ['products'] }) }
  const save = useMutation({ mutationFn: (b: unknown) => api.put('/admin/products', b), onSuccess: () => { toast.success('Saved'); setF(null); refresh() }, onError: (e) => setErr(errorMessage(e)) })
  const toggle = useMutation({ mutationFn: (p: Row) => api.post(`/admin/products/${p.code}/active`, { isActive: !p.isActive }), onSuccess: refresh, onError: (e) => toast.error(errorMessage(e)) })
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setF((x) => (x ? { ...x, [k]: v } : x))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!f) return
    const minor = decimalToMinor(f.amount, minorUnit(f.currency))
    if (minor === null || Number(minor) <= 0) return setErr(`Enter a price with at most ${minorUnit(f.currency)} decimals`)
    setErr(null)
    save.mutate({
      code: f.code, kind: f.kind, name: f.name, description: f.description || undefined, amountMinor: Number(minor), currency: f.currency,
      interval: f.interval, durationHours: f.durationHours ? Number(f.durationHours) : undefined, planTier: f.planTier || undefined, placement: f.placement || undefined,
      trialDays: Number(f.trialDays || 0), features: f.features.split('\n').map((x) => x.trim()).filter(Boolean), isActive: f.isActive, sortOrder: Number(f.sortOrder), reason: f.reason || undefined,
    })
  }
  const cols: Column<Row>[] = [
    { key: 'n', header: 'Product', render: (p) => <span><strong>{p.name}</strong><span className="block font-mono text-xs text-[var(--color-text-muted)]">{p.code}</span></span> },
    { key: 'k', header: 'Kind', render: (p) => enumLabel(p.kind) },
    { key: 'a', header: 'Price', render: (p) => `${money(p.amount, p.currency)}${p.interval !== 'ONE_TIME' ? ` / ${p.interval === 'YEAR' ? 'yr' : 'mo'}` : ''}` },
    { key: 'd', header: 'Details', render: (p) => <span className="text-xs">{p.durationHours ? `${p.durationHours}h ` : ''}{p.planTier ?? ''} {p.placement ? enumLabel(p.placement) : ''}</span> },
    { key: 's', header: 'Status', render: (p) => <StatusBadge label={p.isActive ? 'Active' : 'Off'} variant={p.isActive ? 'success' : 'neutral'} /> },
    { key: 'x', header: '', render: (p) => <span className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setErr(null); setIsEdit(true); setF({ code: p.code, kind: p.kind, name: p.name, description: p.description ?? '', amount: minorToDecimal(p.amountMinor, minorUnit(p.currency)), currency: p.currency, interval: p.interval, durationHours: p.durationHours ? String(p.durationHours) : '', planTier: p.planTier ?? '', placement: p.placement ?? '', trialDays: String(p.trialDays), features: p.features.join('\n'), isActive: p.isActive, sortOrder: String(p.sortOrder), reason: '' }) }}>Edit</Button>
      <Button size="sm" variant="outline" onClick={() => toggle.mutate(p)}>{p.isActive ? 'Disable' : 'Enable'}</Button></span> },
  ]
  return (
    <div>
      <PageHeader title="Products & plans" description="Everything members can buy from CashMouver. Prices are charged through Stripe at checkout." actions={<Button onClick={() => { setErr(null); setIsEdit(false); setF(blank) }}>New product</Button>} />
      <Notice tone="info" className="mb-5">Price changes apply to new purchases only. Past payments and ledger entries are never edited.</Notice>
      {f && (
        <form onSubmit={submit} className="mb-6 grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:grid-cols-3">
          <Field label="Code" hint="Letters, digits, underscore. Fixed once created."><TextInput value={f.code} disabled={isEdit} onChange={(e) => set('code', e.target.value.toUpperCase())} /></Field>
          <Field label="Kind"><NativeSelect value={f.kind} onChange={(e) => set('kind', e.target.value)}>{PRODUCT_KINDS.map((k) => <option key={k} value={k}>{enumLabel(k)}</option>)}</NativeSelect></Field>
          <Field label="Name"><TextInput value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Price"><TextInput inputMode="decimal" value={f.amount} onChange={(e) => set('amount', e.target.value)} placeholder="9.99" /></Field>
          <Field label="Currency"><CurrencySelect value={f.currency} onChange={(v) => set('currency', v)} /></Field>
          <Field label="Billing"><NativeSelect value={f.interval} onChange={(e) => set('interval', e.target.value)}>{BILLING_INTERVALS.map((k) => <option key={k} value={k}>{enumLabel(k)}</option>)}</NativeSelect></Field>
          <Field label="Duration (hours)" hint="Boost / featured / advertising"><TextInput inputMode="numeric" value={f.durationHours} onChange={(e) => set('durationHours', e.target.value)} /></Field>
          <Field label="Plan tier"><NativeSelect value={f.planTier} onChange={(e) => set('planTier', e.target.value)}><option value="">—</option>{PLAN_TIERS.map((k) => <option key={k} value={k}>{enumLabel(k)}</option>)}</NativeSelect></Field>
          <Field label="Placement"><NativeSelect value={f.placement} onChange={(e) => set('placement', e.target.value)}><option value="">—</option>{FEATURED_PLACEMENTS.map((k) => <option key={k} value={k}>{enumLabel(k)}</option>)}</NativeSelect></Field>
          <Field label="Trial days"><TextInput inputMode="numeric" value={f.trialDays} onChange={(e) => set('trialDays', e.target.value)} /></Field>
          <Field label="Sort order"><TextInput inputMode="numeric" value={f.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} /></Field>
          <Checkbox checked={f.isActive} onChange={(v) => set('isActive', v)}>Available for purchase</Checkbox>
          <Field label="Description" className="sm:col-span-3"><TextInput value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <Field label="Feature bullets (one per line)" className="sm:col-span-3"><TextArea value={f.features} onChange={(e) => set('features', e.target.value)} /></Field>
          <Field label="Reason for change (audit log)" className="sm:col-span-3"><TextInput value={f.reason} onChange={(e) => set('reason', e.target.value)} /></Field>
          {err && <p className="text-sm text-red-600 sm:col-span-3" role="alert">{err}</p>}
          <div className="flex gap-2 sm:col-span-3"><Button type="submit" disabled={save.isPending}>Save</Button><Button type="button" variant="ghost" onClick={() => setF(null)}>Cancel</Button></div>
        </form>
      )}
      {q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : <DataTable columns={cols} data={q.data ?? []} keyFn={(p) => p.code} isLoading={q.isLoading} />}
    </div>
  )
}
