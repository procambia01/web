'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, errorMessage } from '@/lib/api'
import { enumLabel, formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Field, NativeSelect, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/states'
import { FilterTabs, Json } from '@/components/admin/bits'
import { Pager } from '@/components/shared/Pager'

interface Flag { id: string; userId: string | null; swapId: string | null; type: string; severity: string; score: number; action: string; status: string; details: unknown; createdAt: string; reviews: { id: string; decision: string; note: string | null; createdAt: string }[] }
const DECISIONS = ['DISMISS', 'REQUIRE_VERIFICATION', 'LIMIT_AMOUNT', 'SUSPEND_OFFER', 'SUSPEND_TRADING', 'REQUIRE_REVIEW'] as const
const SEV: Record<string, 'neutral' | 'warning' | 'error'> = { LOW: 'neutral', MEDIUM: 'warning', HIGH: 'error', CRITICAL: 'error' }

export default function AdminRisk() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('OPEN')
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState<Record<string, { decision: string; note: string }>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const q = useQuery({ queryKey: ['admin', 'risk', status, page], queryFn: () => api.page<Flag>('/admin/risk', { status: status || undefined, page, perPage: 10 }) })

  async function submit(f: Flag) {
    const d = draft[f.id] ?? { decision: 'DISMISS', note: '' }
    setBusy(f.id)
    try { await api.post(`/admin/risk/${f.id}/review`, { decision: d.decision, note: d.note || undefined }); toast.success('Review saved'); await qc.invalidateQueries({ queryKey: ['admin', 'risk'] }) }
    catch (e) { toast.error(errorMessage(e)) } finally { setBusy(null) }
  }
  return (
    <div>
      <PageHeader title="Risk flags" description="Automated signals. Actions limit marketplace access — nobody's money is held or moved." />
      <FilterTabs value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[['OPEN', 'Open'], ['REVIEWING', 'Reviewing'], ['ACTIONED', 'Actioned'], ['DISMISSED', 'Dismissed'], ['', 'All']] as const} />
      {q.isLoading ? <PageLoader /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !q.data?.items.length ? <EmptyState title="No flags" /> : (
        <>
          <ul className="space-y-3">
            {q.data.items.map((f) => {
              const d = draft[f.id] ?? { decision: 'DISMISS', note: '' }
              const open = f.status === 'OPEN' || f.status === 'REVIEWING'
              return (
                <li key={f.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{enumLabel(f.type)} <span className="text-xs font-normal text-[var(--color-text-muted)]">score {f.score} · {formatDateTime(f.createdAt)}</span></p>
                    <span className="flex gap-2"><StatusBadge label={f.severity} variant={SEV[f.severity] ?? 'neutral'} /><StatusBadge label={enumLabel(f.status)} variant="info" /></span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{f.userId && <a className="underline" href={`/admin/users/${f.userId}`}>Member</a>} {f.swapId && `· swap ${f.swapId}`} · suggested: {enumLabel(f.action)}</p>
                  <div className="mt-2"><Json value={f.details} /></div>
                  {f.reviews.map((r) => <p key={r.id} className="mt-1 text-xs">Reviewed: <strong>{enumLabel(r.decision)}</strong> {r.note}</p>)}
                  {open && (
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <Field label="Decision"><NativeSelect value={d.decision} onChange={(e) => setDraft({ ...draft, [f.id]: { ...d, decision: e.target.value } })}>{DECISIONS.map((x) => <option key={x} value={x}>{enumLabel(x)}</option>)}</NativeSelect></Field>
                      <Field label={d.decision === 'DISMISS' ? 'Note (optional)' : 'Note (required)'} className="min-w-64 flex-1"><TextInput value={d.note} onChange={(e) => setDraft({ ...draft, [f.id]: { ...d, note: e.target.value } })} /></Field>
                      <Button disabled={busy === f.id || (d.decision !== 'DISMISS' && d.note.trim().length < 5)} onClick={() => submit(f)}>Save</Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <Pager meta={q.data.meta} onPage={setPage} />
        </>
      )}
    </div>
  )
}
