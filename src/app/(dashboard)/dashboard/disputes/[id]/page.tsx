'use client'
import { use, useRef, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileUp, Paperclip } from 'lucide-react'
import toast from 'react-hot-toast'
import type { DisputeDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { enumLabel, formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, NativeSelect, TextArea } from '@/components/ui/field'
import { ErrorState, Notice, PageLoader } from '@/components/ui/states'
import { StatusBadge } from '@/components/ui/status-badge'
import { DISPUTE_VARIANT } from '@/lib/constants'

const EVIDENCE_TYPES = ['PHOTO', 'SCREENSHOT', 'DOCUMENT', 'CHAT_EXPORT', 'OTHER'] as const

export default function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [note, setNote] = useState('')
  const [etype, setEtype] = useState<string>('PHOTO')
  const q = useQuery({ queryKey: ['dispute', id], queryFn: () => api.get<DisputeDto>(`/disputes/${id}`) })
  const refresh = () => qc.invalidateQueries({ queryKey: ['dispute', id] })
  const comment = useMutation({ mutationFn: () => api.post(`/disputes/${id}/comments`, { note: note.trim() }), onSuccess: () => { setNote(''); void refresh() }, onError: (e) => toast.error(errorMessage(e)) })
  const upload = useMutation({
    mutationFn: (file: File) => { const f = new FormData(); f.append('file', file); f.append('type', etype); return api.upload(`/disputes/${id}/evidence`, f) },
    onSuccess: () => { toast.success('Evidence added'); void refresh() },
    onError: (e) => toast.error(errorMessage(e)),
  })
  async function view(evidenceId: string) {
    try { const r = await api.get<{ url: string }>(`/disputes/evidence/${evidenceId}/url`); window.open(r.url, '_blank', 'noopener,noreferrer') } catch (e) { toast.error(errorMessage(e)) }
  }

  if (q.isLoading) return <PageLoader />
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const d = q.data
  const open = d.status === 'OPEN' || d.status === 'INVESTIGATING'

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl">{enumLabel(d.reason)}</h1><StatusBadge label={d.status} variant={DISPUTE_VARIANT[d.status]} />{d.isEscalated && <StatusBadge label="Escalated" variant="error" />}</div>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Opened {formatDateTime(d.createdAt)} · <Link className="underline" href={`/dashboard/swaps/${d.swapId}`}>view swap</Link></p>
      </div>
      <Card><CardContent><p className="whitespace-pre-wrap text-sm">{d.description}</p></CardContent></Card>

      {d.status === 'RESOLVED' || d.status === 'CLOSED' ? (
        <Notice tone="success"><strong>Outcome: {d.outcome ? enumLabel(d.outcome) : 'Closed'}.</strong>{d.resolutionNote && <> {d.resolutionNote}</>}<br /><span className="text-xs">CashMouver decides conduct outcomes only. We never refund or move the cash that was exchanged.</span></Notice>
      ) : <Notice tone="info">Our team is reviewing this. Add any evidence or details that help. We cannot recover exchanged cash; we can warn or restrict accounts.</Notice>}

      <Card>
        <CardHeader><CardTitle>Evidence</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {d.evidence.length === 0 ? <p className="text-sm text-[var(--color-text-muted)]">No evidence uploaded yet.</p> : (
            <ul className="divide-y divide-[var(--color-divider)]">{d.evidence.map((e) => <li key={e.id} className="flex items-center justify-between py-2 text-sm"><span className="flex items-center gap-2"><Paperclip size={14} />{enumLabel(e.type)} · {(e.sizeBytes / 1024).toFixed(0)} KB {e.uploadedByMe && <em className="text-xs text-[var(--color-text-muted)]">(yours)</em>}</span><Button variant="outline" size="sm" onClick={() => view(e.id)}>View</Button></li>)}</ul>
          )}
          {open && (
            <div className="flex flex-wrap items-end gap-3 border-t border-[var(--color-divider)] pt-3">
              <Field label="Type"><NativeSelect value={etype} onChange={(e) => setEtype(e.target.value)} className="w-44">{EVIDENCE_TYPES.map((t) => <option key={t} value={t}>{enumLabel(t)}</option>)}</NativeSelect></Field>
              <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = '' }} />
              <Button variant="outline" size="lg" className="h-10" disabled={upload.isPending} onClick={() => fileRef.current?.click()}><FileUp size={14} /> {upload.isPending ? 'Uploading…' : 'Upload file'}</Button>
              <p className="w-full text-xs text-[var(--color-text-muted)]">JPG, PNG, WebP or PDF, up to 10 MB. Files are stored privately and shown only to you and our reviewers.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-3 border-l-2 border-[var(--color-border)] pl-5">
            {d.events.map((e) => <li key={e.id} className="relative"><span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" /><p className="text-sm font-medium">{enumLabel(e.type)}</p>{e.note && <p className="text-sm text-[var(--color-text-secondary)]">{e.note}</p>}<p className="text-xs text-[var(--color-text-muted)]">{formatDateTime(e.createdAt)}</p></li>)}
          </ol>
          {open && (
            <div className="mt-5 space-y-2 border-t border-[var(--color-divider)] pt-4">
              <Field label="Add a comment"><TextArea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} /></Field>
              <Button disabled={note.trim().length < 2 || comment.isPending} onClick={() => comment.mutate()}>Post comment</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
