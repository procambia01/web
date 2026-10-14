'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { z } from 'zod'
import type { CurrencyDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { validate } from '@/lib/form'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ErrorState, Notice } from '@/components/ui/states'

const schema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, 'Three letters, e.g. EUR'),
  name: z.string().trim().min(2).max(80), symbol: z.string().trim().min(1).max(8),
  minorUnit: z.coerce.number().int().min(0).max(4), region: z.string().trim().min(2).max(40),
  sortOrder: z.coerce.number().int().min(0).max(10000), isPopular: z.boolean(), isActive: z.boolean(),
})
const blank = { code: '', name: '', symbol: '', minorUnit: '2', region: '', sortOrder: '100', isPopular: false, isActive: true }

export default function AdminCurrencies() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['admin', 'currencies'], queryFn: () => api.get<CurrencyDto[]>('/admin/currencies') })
  const [f, setF] = useState<typeof blank | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['admin', 'currencies'] }); void qc.invalidateQueries({ queryKey: ['currencies'] }) }
  const save = useMutation({ mutationFn: (b: unknown) => api.put('/admin/currencies', b), onSuccess: () => { toast.success('Saved'); setF(null); refresh() }, onError: (e) => toast.error(errorMessage(e)) })
  const toggle = useMutation({ mutationFn: (c: CurrencyDto) => api.post(`/admin/currencies/${c.code}/active`, { isActive: !c.isActive }), onSuccess: refresh, onError: (e) => toast.error(errorMessage(e)) })
  const refreshRates = useMutation({ mutationFn: () => api.post<{ updated: number }>('/admin/rates/refresh'), onSuccess: (r) => toast.success(`${r.updated} rates updated`), onError: (e) => toast.error(errorMessage(e)) })

  const cols: Column<CurrencyDto>[] = [
    { key: 'c', header: 'Code', render: (c) => <strong>{c.code}</strong> }, { key: 'n', header: 'Name', render: (c) => `${c.symbol} ${c.name}` },
    { key: 'm', header: 'Decimals', render: (c) => c.minorUnit }, { key: 'r', header: 'Region', render: (c) => c.region },
    { key: 'p', header: 'Popular', render: (c) => (c.isPopular ? 'Yes' : '') },
    { key: 's', header: 'Status', render: (c) => <StatusBadge label={c.isActive === false ? 'Off' : 'Active'} variant={c.isActive === false ? 'neutral' : 'success'} /> },
    { key: 'a', header: '', render: (c) => <span className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setF({ code: c.code, name: c.name, symbol: c.symbol, minorUnit: String(c.minorUnit), region: c.region, sortOrder: String(c.sortOrder), isPopular: c.isPopular, isActive: c.isActive !== false })}>Edit</Button>
      <Button size="sm" variant="outline" disabled={toggle.isPending} onClick={() => toggle.mutate(c)}>{c.isActive === false ? 'Enable' : 'Disable'}</Button></span> },
  ]
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setF((x) => (x ? { ...x, [k]: v } : x))
  return (
    <div>
      <PageHeader title="Currencies" description="Members can only trade currencies enabled here." actions={<><Button variant="outline" disabled={refreshRates.isPending} onClick={() => refreshRates.mutate()}>Refresh reference rates</Button><Button onClick={() => { setErrors({}); setF(blank) }}>Add currency</Button></>} />
      <Notice tone="info" className="mb-5">Decimals must match the currency (EUR 2, JPY 0, KWD 3). Changing them after offers exist can change how amounts display — prefer disabling.</Notice>
      {f && (
        <form className="mb-6 grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); const { data, errors } = validate(schema, f); setErrors(errors); if (data) save.mutate(data) }}>
          <Field label="Code" error={errors.code}><TextInput value={f.code} maxLength={3} onChange={(e) => set('code', e.target.value.toUpperCase())} /></Field>
          <Field label="Name" error={errors.name}><TextInput value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Symbol" error={errors.symbol}><TextInput value={f.symbol} onChange={(e) => set('symbol', e.target.value)} /></Field>
          <Field label="Decimals" error={errors.minorUnit}><TextInput inputMode="numeric" value={f.minorUnit} onChange={(e) => set('minorUnit', e.target.value)} /></Field>
          <Field label="Region" error={errors.region}><TextInput value={f.region} onChange={(e) => set('region', e.target.value)} placeholder="Europe" /></Field>
          <Field label="Sort order" error={errors.sortOrder}><TextInput inputMode="numeric" value={f.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} /></Field>
          <Checkbox checked={f.isPopular} onChange={(v) => set('isPopular', v)}>Popular</Checkbox><Checkbox checked={f.isActive} onChange={(v) => set('isActive', v)}>Active</Checkbox>
          <div className="flex gap-2 sm:col-span-3"><Button type="submit" disabled={save.isPending}>Save</Button><Button type="button" variant="ghost" onClick={() => setF(null)}>Cancel</Button></div>
        </form>
      )}
      {q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : <DataTable columns={cols} data={q.data ?? []} keyFn={(c) => c.code} isLoading={q.isLoading} />}
    </div>
  )
}
