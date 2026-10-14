'use client'
import { use, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { DISPUTE_OUTCOMES, resolveDisputeSchema, type DisputeDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { validate } from '@/lib/form'
import { DISPUTE_VARIANT } from '@/lib/constants'
import { enumLabel, formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Field, NativeSelect, TextArea } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { ErrorState, Notice, PageLoader } from '@/components/ui/states'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Kv } from '@/components/admin/bits'

type AdminDispute = DisputeDto & { reporterId: string; againstId: string; assignedTo: string | null }

export default function AdminDisputeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()
  const [outcome, setOutcome] = useState<string>('NO_ACTION')
  const [note, setNote] = useState('')
  const [swapOutcome, setSwapOutcome] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [evidence, setEvidence] = useState<string | null>(null)
  const [closeOpen, setCloseOpen] = useState(false)
  const q = useQuery({ queryKey: ['admin', 'dispute', id], queryFn: () => api.get<AdminDispute>(`/admin/disputes/${id}`) })
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'dispute', id] })
  const investigate = useMutation({ mutationFn: () => api.post(`/admin/disputes/${id}/investigate`), onSuccess: refresh, onError: (e) => toast.error(errorMessage(e)) })
  const resolve = useMutation({ mutationFn: (b: unknown) => api.post(`/admin/disputes/${id}/resolve`, b), onSuccess: () => { toast.success('Dispute resolved'); void refresh() }, onError: (e) => toast.error(errorMessage(e)) })

  if (q.isLoading) return <PageLoader />
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const d = q.data

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const { data, errors } = validate(resolveDisputeSchema, { outcome, note, swapOutcome: swapOutcome || undefined })
    setErrors(errors)
    if (data) resolve.mutate(data)
  }
  return (
    <div className="max-w-3xl">
      <PageHeader title={enumLabel(d.reason)} description={`Dispute ${d.id}`} actions={<Link className="text-sm underline" href="/admin/disputes">Back</Link>} />
      <Notice tone="info" className="mb-6">Outcomes affect the swap record and the members&apos; accounts only. CashMouver does not hold, move or refund exchanged cash.</Notice>
      <dl className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <Kv k="Status" v={<StatusBadge label={enumLabel(d.status)} variant={DISPUTE_VARIANT[d.status]} />} /><Kv k="Priority" v={d.priority} />
        <Kv k="Reported by" v={<Link className="underline" href={`/admin/users/${d.reporterId}`}>member</Link>} /><Kv k="Against" v={<Link className="underline" href={`/admin/users/${d.againstId}`}>member</Link>} />
        <Kv k="Swap" v={d.swapId} /><Kv k="Opened" v={formatDateTime(d.createdAt)} />{d.outcome && <Kv k="Outcome" v={enumLabel(d.outcome)} />}
      </dl>
      <p className="mb-6 whitespace-pre-wrap rounded-xl bg-[var(--color-bg)] p-3 text-sm">{d.description}</p>

      <h2 className="mb-2 text-lg">Evidence</h2>
      <ul className="mb-6 space-y-2 text-sm">
        {d.evidence.map((ev) => <li key={ev.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-2"><span>{enumLabel(ev.type)} · {ev.mimeType} · {(ev.sizeBytes / 1024).toFixed(0)} KB · {formatDateTime(ev.createdAt)}</span><Button size="sm" variant="outline" onClick={() => setEvidence(ev.id)}>Open</Button></li>)}
        {!d.evidence.length && <li className="text-[var(--color-text-secondary)]">None submitted.</li>}
      </ul>

      <h2 className="mb-2 text-lg">Timeline</h2>
      <ol className="mb-8 space-y-1 text-sm">{d.events.map((ev) => <li key={ev.id}><span className="text-[var(--color-text-muted)]">{formatDateTime(ev.createdAt)}</span> — {enumLabel(ev.type)}{ev.note && `: ${ev.note}`}</li>)}</ol>

      {d.status === 'OPEN' && <Button onClick={() => investigate.mutate()} disabled={investigate.isPending}>Start investigating</Button>}
      {d.status === 'INVESTIGATING' && (
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="text-lg">Resolve</h2>
          <Field label="Outcome" error={errors.outcome}><NativeSelect value={outcome} onChange={(e) => setOutcome(e.target.value)}>{DISPUTE_OUTCOMES.map((o) => <option key={o} value={o}>{enumLabel(o)}</option>)}</NativeSelect></Field>
          <Field label="Swap record" hint="Needed when the swap is still disputed and the outcome doesn't already settle it." error={errors.swapOutcome}>
            <NativeSelect value={swapOutcome} onChange={(e) => setSwapOutcome(e.target.value)}><option value="">Leave as is</option><option value="COMPLETED">Mark completed</option><option value="CANCELLED">Mark cancelled</option></NativeSelect></Field>
          <Field label="Resolution note (shown to both members)" error={errors.note}><TextArea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <Button type="submit" disabled={resolve.isPending}>Resolve dispute</Button>
        </form>
      )}
      {d.status === 'RESOLVED' && <Button variant="outline" onClick={() => setCloseOpen(true)}>Close dispute</Button>}
      <ConfirmDialog open={closeOpen} onOpenChange={setCloseOpen} title="Close this dispute?" confirmLabel="Close" onConfirm={async () => { await api.post(`/admin/disputes/${id}/close`); await refresh() }} />
      {evidence && <ConfirmDialog open onOpenChange={(o) => !o && setEvidence(null)} title="Open evidence" description="Opens a temporary private link. Access is audit-logged." confirmLabel="Open"
        onConfirm={async () => { const r = await api.get<{ url: string }>(`/admin/disputes/evidence/${evidence}/url`); window.open(r.url, '_blank', 'noopener,noreferrer') }} />}
    </div>
  )
}
