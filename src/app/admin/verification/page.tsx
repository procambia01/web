'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { VerificationCaseDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { enumLabel, formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState, ErrorState, Notice, PageLoader } from '@/components/ui/states'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FilterTabs } from '@/components/admin/bits'
import { Pager } from '@/components/shared/Pager'

type Row = VerificationCaseDto & { user: { id: string; name: string; email: string } }

export default function AdminVerification() {
  const qc = useQueryClient()
  const [status, setStatus] = useState<'SUBMITTED' | 'UNDER_REVIEW'>('SUBMITTED')
  const [page, setPage] = useState(1)
  const [decide, setDecide] = useState<{ row: Row; decision: 'VERIFIED' | 'REJECTED' } | null>(null)
  const [docFor, setDocFor] = useState<string | null>(null)
  const q = useQuery({ queryKey: ['admin', 'verification', status, page], queryFn: () => api.page<Row>('/admin/verification', { status, page, perPage: 10 }) })
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'verification'] })
  const start = useMutation({ mutationFn: (id: string) => api.post(`/admin/verification/${id}/start`), onSuccess: refresh, onError: (e) => toast.error(errorMessage(e)) })

  return (
    <div>
      <PageHeader title="Identity verification" description="Documents are private. Each view is logged with your reason and opens a short-lived link." />
      <Notice tone="warning" className="mb-5">Open documents only to make a decision. Never copy, download or share them.</Notice>
      <FilterTabs value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[['SUBMITTED', 'Waiting'], ['UNDER_REVIEW', 'In review']] as const} />
      {q.isLoading ? <PageLoader /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !q.data?.items.length ? <EmptyState title="Queue is empty" /> : (
        <>
          <ul className="space-y-3">
            {q.data.items.map((c) => (
              <li key={c.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-semibold">{c.user.name} <span className="font-normal text-[var(--color-text-muted)]">{c.user.email}</span></p>
                    <p className="text-[var(--color-text-secondary)]">{enumLabel(c.type)} · {enumLabel(c.tier)} · {enumLabel(c.documentType)} ({c.documentCountry}){c.businessName && ` · ${c.businessName}`}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Submitted {formatDateTime(c.submittedAt)}</p>
                  </div>
                  <StatusBadge label={enumLabel(c.status)} variant="info" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(c.documents ?? []).map((d) => <Button key={d.id} size="sm" variant="outline" onClick={() => setDocFor(d.id)}>View {enumLabel(d.kind)}</Button>)}
                </div>
                <div className="mt-3 flex gap-2">
                  {c.status === 'SUBMITTED' && <Button size="sm" disabled={start.isPending} onClick={() => start.mutate(c.id)}>Start review</Button>}
                  {c.status === 'UNDER_REVIEW' && <><Button size="sm" onClick={() => setDecide({ row: c, decision: 'VERIFIED' })}>Approve</Button><Button size="sm" variant="outline" onClick={() => setDecide({ row: c, decision: 'REJECTED' })}>Reject</Button></>}
                </div>
              </li>
            ))}
          </ul>
          <Pager meta={q.data.meta} onPage={setPage} />
        </>
      )}
      {decide && (
        <ConfirmDialog open onOpenChange={(o) => !o && setDecide(null)} title={decide.decision === 'VERIFIED' ? `Verify ${decide.row.user.name}?` : `Reject ${decide.row.user.name}?`}
          description={decide.decision === 'REJECTED' ? 'The member sees this reason, so keep it factual and polite.' : undefined}
          confirmLabel={decide.decision === 'VERIFIED' ? 'Verify' : 'Reject'} destructive={decide.decision === 'REJECTED'}
          reasonLabel={decide.decision === 'REJECTED' ? 'Reason (required)' : 'Note (optional)'} reasonMin={decide.decision === 'REJECTED' ? 5 : 0}
          onConfirm={async (reason) => { await api.post(`/admin/verification/${decide.row.id}/decision`, { decision: decide.decision, reason: reason || undefined }); toast.success('Decision saved'); await refresh() }} />
      )}
      {docFor && (
        <ConfirmDialog open onOpenChange={(o) => !o && setDocFor(null)} title="Open document" description="Opens a temporary private link. This access is recorded in the audit log." confirmLabel="Open" reasonLabel="Why are you opening it?" reasonMin={5}
          onConfirm={async (reason) => { const r = await api.post<{ url: string }>(`/admin/verification/documents/${docFor}/url`, { reason }); window.open(r.url, '_blank', 'noopener,noreferrer') }} />
      )}
    </div>
  )
}
