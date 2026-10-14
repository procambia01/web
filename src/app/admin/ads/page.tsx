'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { OwnerAdDto } from '@/contracts'
import { api } from '@/lib/api'
import { enumLabel } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/states'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Pager } from '@/components/shared/Pager'

export default function AdminAds() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [act, setAct] = useState<{ ad: OwnerAdDto; decision: 'APPROVE' | 'REJECT' } | null>(null)
  const q = useQuery({ queryKey: ['admin', 'ads', page], queryFn: () => api.page<OwnerAdDto>('/admin/ads/review', { page, perPage: 10 }) })
  return (
    <div>
      <PageHeader title="Ad review" description="Paid campaigns waiting for approval. Ads are always shown labelled “Sponsored”." />
      {q.isLoading ? <PageLoader /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !q.data?.items.length ? <EmptyState title="Nothing to review" /> : (
        <>
          <ul className="space-y-3">
            {q.data.items.map((a) => (
              <li key={a.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
                <p className="font-semibold">{a.title}</p>
                {a.body && <p className="text-[var(--color-text-secondary)]">{a.body}</p>}
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{enumLabel(a.type)} · {enumLabel(a.placement)} · currencies {a.currencies.join(', ') || 'any'} · countries {a.countries.join(', ') || 'any'}</p>
                {a.targetUrl && <p className="text-xs">Link: <a className="underline" rel="noopener noreferrer nofollow" target="_blank" href={a.targetUrl}>{a.targetUrl}</a></p>}
                {a.imageUrl && <p className="text-xs">Image: <a className="underline" rel="noopener noreferrer nofollow" target="_blank" href={a.imageUrl}>{a.imageUrl}</a></p>}
                <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => setAct({ ad: a, decision: 'APPROVE' })}>Approve</Button><Button size="sm" variant="outline" onClick={() => setAct({ ad: a, decision: 'REJECT' })}>Reject</Button></div>
              </li>
            ))}
          </ul>
          <Pager meta={q.data.meta} onPage={setPage} />
        </>
      )}
      {act && <ConfirmDialog open onOpenChange={(o) => !o && setAct(null)} title={act.decision === 'APPROVE' ? 'Approve this ad?' : 'Reject this ad?'} confirmLabel={act.decision === 'APPROVE' ? 'Approve' : 'Reject'} destructive={act.decision === 'REJECT'}
        reasonLabel={act.decision === 'REJECT' ? 'Reason shown to the advertiser' : 'Note (optional)'} reasonMin={act.decision === 'REJECT' ? 5 : 0}
        onConfirm={async (note) => { await api.post(`/admin/ads/${act.ad.id}/review`, { decision: act.decision, note: note || undefined }); toast.success('Saved'); await qc.invalidateQueries({ queryKey: ['admin', 'ads'] }) }} />}
    </div>
  )
}
