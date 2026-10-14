'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PAYMENT_STATUSES, PRODUCT_KINDS } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { decimalToMinor, minorToDecimal } from '@/lib/minor'
import { useCurrencies } from '@/hooks/useCurrencies'
import { enumLabel, formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Field, NativeSelect, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ErrorState, Notice } from '@/components/ui/states'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Pay { id: string; userId: string; productCode: string; kind: string; amountMinor: number; currency: string; status: string; refundedMinor: number; createdAt: string; paidAt: string | null; stripePaymentIntentId: string | null; failureReason: string | null }

export default function AdminPayments() {
  const qc = useQueryClient()
  const { money, minorUnit } = useCurrencies()
  const [status, setStatus] = useState('')
  const [kind, setKind] = useState('')
  const [userId, setUserId] = useState('')
  const [page, setPage] = useState(1)
  const [refund, setRefund] = useState<Pay | null>(null)
  const q = useQuery({ queryKey: ['admin', 'payments', status, kind, userId, page], queryFn: () => api.page<Pay>('/admin/payments', { status, kind, userId: /^[a-f0-9]{24}$/i.test(userId) ? userId : undefined, page, perPage: 20 }) })
  const m = (n: number, c: string) => money(minorToDecimal(n, minorUnit(c)), c)
  const cols: Column<Pay>[] = [
    { key: 'd', header: 'Date', render: (p) => formatDateTime(p.paidAt ?? p.createdAt) },
    { key: 'p', header: 'Product', render: (p) => <span>{enumLabel(p.kind)}<span className="block font-mono text-xs text-[var(--color-text-muted)]">{p.productCode}</span></span> },
    { key: 'u', header: 'Member', render: (p) => <a className="font-mono text-xs underline" href={`/admin/users/${p.userId}`}>{p.userId.slice(-8)}</a> },
    { key: 'a', header: 'Amount', render: (p) => <span>{m(p.amountMinor, p.currency)}{p.refundedMinor > 0 && <span className="block text-xs text-[var(--color-text-muted)]">refunded {m(p.refundedMinor, p.currency)}</span>}</span> },
    { key: 's', header: 'Status', render: (p) => <StatusBadge label={enumLabel(p.status)} variant={p.status === 'SUCCEEDED' ? 'success' : p.status === 'FAILED' ? 'error' : 'neutral'} /> },
    { key: 'x', header: '', render: (p) => ['SUCCEEDED', 'PARTIALLY_REFUNDED'].includes(p.status) && p.refundedMinor < p.amountMinor ? <Button size="sm" variant="outline" onClick={() => setRefund(p)}>Refund</Button> : null },
  ]
  return (
    <div>
      <PageHeader title="Service payments" description="What members paid CashMouver for plans and promotions." />
      <Notice tone="warning" className="mb-5">Refunds here return a CashMouver service fee to the payer through Stripe. They never concern cash exchanged between members.</Notice>
      <div className="mb-5 flex flex-wrap gap-3">
        <Field label="Status"><NativeSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">All</option>{PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{enumLabel(s)}</option>)}</NativeSelect></Field>
        <Field label="Kind"><NativeSelect value={kind} onChange={(e) => { setKind(e.target.value); setPage(1) }}><option value="">All</option>{PRODUCT_KINDS.map((s) => <option key={s} value={s}>{enumLabel(s)}</option>)}</NativeSelect></Field>
        <Field label="Member ID"><TextInput value={userId} onChange={(e) => { setUserId(e.target.value.trim()); setPage(1) }} placeholder="24-character id" /></Field>
      </div>
      {q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : <DataTable columns={cols} data={q.data?.items ?? []} keyFn={(p) => p.id} isLoading={q.isLoading} emptyTitle="No payments"
        page={q.data?.meta.page} totalPages={q.data?.meta.totalPages} total={q.data?.meta.total} perPage={20} onPageChange={setPage} />}
      {refund && <RefundDialog pay={refund} fmt={m} unit={minorUnit(refund.currency)} onClose={() => setRefund(null)} onDone={() => qc.invalidateQueries({ queryKey: ['admin', 'payments'] })} />}
    </div>
  )
}

function RefundDialog({ pay, fmt, unit, onClose, onDone }: { pay: Pay; fmt: (n: number, c: string) => string; unit: number; onClose: () => void; onDone: () => unknown }) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const left = pay.amountMinor - pay.refundedMinor
  async function go() {
    let amountMinor: number | undefined
    if (amount.trim()) {
      const mm = decimalToMinor(amount, unit)
      if (mm === null || Number(mm) <= 0 || Number(mm) > left) return setErr('Enter a valid amount up to the refundable balance')
      amountMinor = Number(mm)
    }
    setBusy(true); setErr(null)
    try { await api.post(`/admin/payments/${pay.id}/refund`, { reason: reason.trim(), amountMinor }); toast.success('Refund requested'); await onDone(); onClose() }
    catch (e) { setErr(errorMessage(e)) } finally { setBusy(false) }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Refund {pay.productCode}</DialogTitle><DialogDescription>Paid {fmt(pay.amountMinor, pay.currency)} · refundable {fmt(left, pay.currency)}. Processed by Stripe and recorded as a new ledger entry.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <Field label={`Amount in ${pay.currency} (empty = full remainder)`}><TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Reason (audit log)"><TextInput value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        </div>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={busy || reason.trim().length < 5} onClick={go}>{busy ? 'Refunding…' : 'Refund via Stripe'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
