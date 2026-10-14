'use client'
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, errorMessage } from '@/lib/api'
import { decimalToMinor, minorToDecimal } from '@/lib/minor'
import { useAuthStore } from '@/store/auth.store'
import { useCurrencies } from '@/hooks/useCurrencies'
import { enumLabel, formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Field, NativeSelect, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ErrorState, Notice } from '@/components/ui/states'
import { CurrencySelect } from '@/components/shared/CurrencySelect'

interface Entry { id: string; entryType: string; direction: 'CREDIT' | 'DEBIT'; amountMinor: number; currency: string; paymentId: string | null; reversesId: string | null; reference: string; description: string | null; createdAt: string }
const TYPES = ['PREMIUM_SUBSCRIPTION', 'BUSINESS_SUBSCRIPTION', 'API_SUBSCRIPTION', 'BOOST_PURCHASE', 'FEATURED_PURCHASE', 'VERIFICATION_FEE', 'AD_PURCHASE', 'REFUND', 'REFERRAL_REWARD', 'ADJUSTMENT']
const isoDay = (d: Date) => d.toISOString().slice(0, 10)

export default function AdminLedger() {
  const role = useAuthStore((s) => s.user?.role)
  const qc = useQueryClient()
  const { money, minorUnit } = useCurrencies()
  const [entryType, setEntryType] = useState('')
  const [currency, setCurrency] = useState('')
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState(isoDay(new Date(Date.now() - 30 * 86_400_000)))
  const [to, setTo] = useState(isoDay(new Date(Date.now() + 86_400_000)))
  const list = useQuery({ queryKey: ['admin', 'ledger', entryType, currency, page], queryFn: () => api.page<Entry>('/admin/ledger', { entryType, currency, page, perPage: 25 }) })
  const sum = useQuery({ queryKey: ['admin', 'ledger-sum', from, to], queryFn: () => api.get<{ currency: string; entryType: string; netMinor: number }[]>('/admin/ledger/summary', { from: new Date(from).toISOString(), to: new Date(to).toISOString() }) })
  const m = (n: number, c: string) => money(minorToDecimal(n, minorUnit(c)), c)
  const totals = useMemo(() => { const t = new Map<string, number>(); for (const r of sum.data ?? []) t.set(r.currency, (t.get(r.currency) ?? 0) + r.netMinor); return [...t.entries()] }, [sum.data])

  const cols: Column<Entry>[] = [
    { key: 'd', header: 'Date', render: (e) => formatDateTime(e.createdAt) }, { key: 't', header: 'Type', render: (e) => enumLabel(e.entryType) },
    { key: 'a', header: 'Amount', render: (e) => <span className={e.direction === 'DEBIT' ? 'text-red-600' : ''}>{e.direction === 'DEBIT' ? '−' : '+'}{m(e.amountMinor, e.currency)}</span> },
    { key: 'r', header: 'Reference', render: (e) => <span className="font-mono text-xs">{e.reference}{e.description && <span className="block font-sans text-[var(--color-text-muted)]">{e.description}</span>}</span> },
  ]
  return (
    <div>
      <PageHeader title="Revenue ledger" description="Append-only record of CashMouver's own service revenue. Entries are never edited — corrections are new, reasoned entries." />
      <Notice tone="info" className="mb-5">This ledger is not a wallet. It holds no member balances and no exchanged currency.</Notice>
      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-end gap-3"><Field label="From"><TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field><Field label="To (exclusive)"><TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field></div>
        {sum.error ? <ErrorState error={sum.error} onRetry={() => sum.refetch()} /> : (
          <div className="grid gap-4 md:grid-cols-2">
            <div><h2 className="mb-1 text-base">Net by currency</h2><ul className="text-sm">{totals.map(([c, n]) => <li key={c} className="flex justify-between border-b border-[var(--color-border)] py-1"><span>{c}</span><strong>{m(n, c)}</strong></li>)}{!totals.length && <li className="text-[var(--color-text-secondary)]">No entries in range.</li>}</ul></div>
            <div><h2 className="mb-1 text-base">By type</h2><ul className="text-sm">{(sum.data ?? []).map((r) => <li key={r.currency + r.entryType} className="flex justify-between border-b border-[var(--color-border)] py-1"><span>{enumLabel(r.entryType)} ({r.currency})</span><span>{m(r.netMinor, r.currency)}</span></li>)}</ul></div>
          </div>
        )}
      </section>
      <div className="mb-4 flex flex-wrap gap-3">
        <Field label="Type"><NativeSelect value={entryType} onChange={(e) => { setEntryType(e.target.value); setPage(1) }}><option value="">All</option>{TYPES.map((t) => <option key={t} value={t}>{enumLabel(t)}</option>)}</NativeSelect></Field>
        <Field label="Currency"><CurrencySelect value={currency} onChange={(v) => { setCurrency(v); setPage(1) }} includeAny /></Field>
      </div>
      {list.error ? <ErrorState error={list.error} onRetry={() => list.refetch()} /> : <DataTable columns={cols} data={list.data?.items ?? []} keyFn={(e) => e.id} isLoading={list.isLoading} emptyTitle="No entries"
        page={list.data?.meta.page} totalPages={list.data?.meta.totalPages} total={list.data?.meta.total} perPage={25} onPageChange={setPage} />}
      {role === 'SUPER_ADMIN' && <Adjustment onDone={() => { void qc.invalidateQueries({ queryKey: ['admin', 'ledger'] }); void qc.invalidateQueries({ queryKey: ['admin', 'ledger-sum'] }) }} />}
    </div>
  )
}

function Adjustment({ onDone }: { onDone: () => void }) {
  const { minorUnit } = useCurrencies()
  const [f, setF] = useState({ direction: 'CREDIT', amount: '', currency: 'EUR', reason: '', paymentId: '', reversesId: '' })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function go(e: React.FormEvent) {
    e.preventDefault()
    const minor = decimalToMinor(f.amount, minorUnit(f.currency))
    if (minor === null || Number(minor) <= 0) return setErr('Enter a positive amount with valid decimals')
    setBusy(true); setErr(null)
    try {
      await api.post('/admin/ledger/adjustments', { direction: f.direction, amountMinor: Number(minor), currency: f.currency, reason: f.reason.trim(), paymentId: f.paymentId || undefined, reversesId: f.reversesId || undefined })
      toast.success('Adjustment recorded'); setF({ ...f, amount: '', reason: '' }); onDone()
    } catch (e2) { setErr(errorMessage(e2)) } finally { setBusy(false) }
  }
  return (
    <details className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <summary className="cursor-pointer text-lg font-semibold">Record a correcting entry (super admin)</summary>
      <form onSubmit={go} className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Direction"><NativeSelect value={f.direction} onChange={(e) => setF({ ...f, direction: e.target.value })}><option value="CREDIT">Credit (adds revenue)</option><option value="DEBIT">Debit (removes revenue)</option></NativeSelect></Field>
        <Field label="Amount"><TextInput inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label="Currency"><CurrencySelect value={f.currency} onChange={(v) => setF({ ...f, currency: v })} /></Field>
        <Field label="Payment ID (optional)"><TextInput value={f.paymentId} onChange={(e) => setF({ ...f, paymentId: e.target.value.trim() })} /></Field>
        <Field label="Reverses entry ID (optional)"><TextInput value={f.reversesId} onChange={(e) => setF({ ...f, reversesId: e.target.value.trim() })} /></Field>
        <Field label="Reason (required)"><TextInput value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
        {err && <p role="alert" className="text-sm text-red-600 sm:col-span-3">{err}</p>}
        <div className="sm:col-span-3"><Button type="submit" disabled={busy || f.reason.trim().length < 5}>Record entry</Button></div>
      </form>
    </details>
  )
}
