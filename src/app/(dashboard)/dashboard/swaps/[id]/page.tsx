'use client'
import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { parseAsString, useQueryState } from 'nuqs'
import { AlertTriangle, ArrowRight, Check, Clock, Hourglass, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { DISPUTE_REASONS, type SwapDto, type SwapEventDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { useCurrencies } from '@/hooks/useCurrencies'
import { enumLabel, formatDateTime, formatRate, timeLeft } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, NativeSelect, TextArea } from '@/components/ui/field'
import { ErrorState, Notice, PageLoader } from '@/components/ui/states'
import { SwapStatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrustBadges } from '@/components/shared/TrustBadges'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { MeetupPanel } from '@/components/shared/MeetupPanel'
import { ChatPanel } from '@/components/shared/ChatPanel'
import { RatingDialog } from '@/components/shared/RatingDialog'

function DisputeDialog({ swapId, open, onOpenChange }: { swapId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter()
  const [reason, setReason] = useState<string>('NO_SHOW')
  const [description, setDescription] = useState('')
  const m = useMutation({
    mutationFn: () => api.post<{ id: string }>(`/swaps/${swapId}/dispute`, { reason, description: description.trim() }),
    onSuccess: (d) => { toast.success('Dispute opened. Our team will review it.'); router.push(`/dashboard/disputes/${d.id}`) },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Open a dispute</DialogTitle><DialogDescription>Describe what went wrong. You can add photos or documents as evidence afterwards.</DialogDescription></DialogHeader>
        <Notice tone="warning">CashMouver reviews conduct and evidence and can warn or restrict accounts. We cannot recover or refund the cash you exchanged.</Notice>
        <Field label="What happened?"><NativeSelect value={reason} onChange={(e) => setReason(e.target.value)}>{DISPUTE_REASONS.map((r) => <option key={r} value={r}>{enumLabel(r)}</option>)}</NativeSelect></Field>
        <Field label="Details" hint="At least 10 characters"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} /></Field>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="destructive" disabled={description.trim().length < 10 || m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Opening…' : 'Open dispute'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExtendDialog({ swapId, open, onOpenChange, onDone }: { swapId: string; open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [hours, setHours] = useState('6')
  const m = useMutation({
    mutationFn: () => api.post(`/swaps/${swapId}/extend`, { hours: Number(hours) }),
    onSuccess: () => { toast.success('Deadline extended'); onDone(); onOpenChange(false) },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Extend the deadline</DialogTitle><DialogDescription>Give both of you more time. The reserved amount stays set aside on the offer.</DialogDescription></DialogHeader>
        <Field label="Extra time"><NativeSelect value={hours} onChange={(e) => setHours(e.target.value)}>{['1', '3', '6', '12', '24', '48'].map((h) => <option key={h} value={h}>{h} hour{h === '1' ? '' : 's'}</option>)}</NativeSelect></Field>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => m.mutate()} disabled={m.isPending}>Extend</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SwapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()
  const { money } = useCurrencies()
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('details'))
  const [dlg, setDlg] = useState<null | 'cancel' | 'reject' | 'dispute' | 'extend' | 'rate' | 'confirm'>(null)

  const q = useQuery({ queryKey: ['swap', id], queryFn: () => api.get<SwapDto>(`/swaps/${id}`), refetchInterval: 15_000 })
  const events = useQuery({ queryKey: ['swap-events', id], queryFn: () => api.get<SwapEventDto[]>(`/swaps/${id}/events`), enabled: tab === 'history' })

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['swap', id] }); void qc.invalidateQueries({ queryKey: ['swaps'] }); void qc.invalidateQueries({ queryKey: ['swap-events', id] })
    void qc.invalidateQueries({ queryKey: ['entitlements'] }); void qc.invalidateQueries({ queryKey: ['unread'] })
  }
  const act = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown }) => api.post<SwapDto>(`/swaps/${id}/${path}`, body),
    onSuccess: (_d, v) => { refresh(); if (v.path === 'accept') toast.success('Swap accepted — plan the meetup'); if (v.path === 'confirm') toast.success('Confirmation recorded') },
    onError: (e) => { toast.error(errorMessage(e)); refresh() },
  })

  if (q.isLoading) return <PageLoader />
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const s = q.data
  const other = s.iAm === 'INITIATOR' ? s.receiver : s.initiator
  const terms = s.agreed ?? s.requested
  const give = s.iAm === 'INITIATOR' ? { amount: terms.wantAmount, ccy: s.wantCurrency } : { amount: terms.haveAmount, ccy: s.haveCurrency }
  const get = s.iAm === 'INITIATOR' ? { amount: terms.haveAmount, ccy: s.haveCurrency } : { amount: terms.wantAmount, ccy: s.wantCurrency }
  const can = (a: SwapDto['allowedActions'][number]) => s.allowedActions.includes(a)
  const active = ['PENDING', 'AGREED', 'IN_PROGRESS', 'CONFIRMING'].includes(s.status)

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3"><h1 className="text-2xl">Swap with {other.name}</h1><SwapStatusBadge status={s.status} /></div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Created {formatDateTime(s.createdAt)} · <Link href={`/dashboard/offers/${s.offerId}`} className="underline">view offer</Link></p>
        </div>
        {['PENDING', 'AGREED'].includes(s.status) && <p className="flex items-center gap-1.5 rounded-full bg-[var(--color-warning-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-warning-text)] dark:bg-amber-950 dark:text-amber-300"><Hourglass size={12} /> Expires in {timeLeft(s.expiresAt)}</p>}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div><p className="text-xs text-[var(--color-text-muted)]">You give</p><p className="font-display text-2xl font-bold">{money(give.amount, give.ccy)}</p></div>
        <ArrowRight className="mx-3 text-[var(--color-text-muted)]" />
        <div><p className="text-xs text-[var(--color-text-muted)]">You receive</p><p className="font-display text-2xl font-bold text-[var(--color-primary)]">{money(get.amount, get.ccy)}</p></div>
        <p className="ml-auto text-sm text-[var(--color-text-secondary)]">1 {s.haveCurrency} = {formatRate(terms.exchangeRate)} {s.wantCurrency}{s.agreed && <span className="ml-1 rounded bg-[var(--color-success-bg)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--color-success-text)] dark:bg-emerald-950 dark:text-emerald-300">Locked</span>}</p>
      </div>

      {s.status === 'PENDING' && s.iAm === 'INITIATOR' && <Notice tone="info" className="mb-4">Waiting for {other.name} to accept. The amount is set aside on their offer until then.</Notice>}
      {s.status === 'CONFIRMING' && <Notice tone="info" className="mb-4">{s.myConfirmed ? `You confirmed. Waiting for ${other.name} to confirm.` : s.otherConfirmed ? `${other.name} has confirmed. Confirm once you have handed over and received your cash.` : 'Confirm once you have handed over and received your cash.'}</Notice>}
      {s.status === 'DISPUTED' && <Notice tone="warning" className="mb-4">This swap is under review. <Link href="/dashboard/disputes" className="font-semibold underline">View your disputes</Link></Notice>}
      {s.status === 'CANCELLED' && s.cancellationReason && <Notice tone="info" className="mb-4">Cancelled: {s.cancellationReason}</Notice>}

      <div className="mb-6 flex flex-wrap gap-2">
        {can('ACCEPT') && <Button disabled={act.isPending} onClick={() => act.mutate({ path: 'accept' })}><Check size={14} /> Accept swap</Button>}
        {can('REJECT') && <Button variant="outline" onClick={() => setDlg('reject')}>Decline</Button>}
        {s.status === 'AGREED' && <Button disabled={act.isPending} onClick={() => act.mutate({ path: 'start' })}>We&apos;re meeting now</Button>}
        {can('CONFIRM') && <Button disabled={act.isPending} onClick={() => setDlg('confirm')}><Check size={14} /> I handed over and received my cash</Button>}
        {can('EXTEND') && <Button variant="outline" onClick={() => setDlg('extend')}><Clock size={14} /> Extend time</Button>}
        {can('RATE') && <Button variant="outline" onClick={() => setDlg('rate')}><Star size={14} /> Rate {other.name}</Button>}
        {can('CANCEL') && <Button variant="ghost" onClick={() => setDlg('cancel')}>Cancel swap</Button>}
        {can('DISPUTE') && <Button variant="destructive" onClick={() => setDlg('dispute')}><AlertTriangle size={14} /> Report a problem</Button>}
      </div>

      <Tabs value={tab} onValueChange={(v) => void setTab(v)}>
        <TabsList><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="meetup">Meetup</TabsTrigger><TabsTrigger value="chat">Chat{!!s.unreadMessages && ` (${s.unreadMessages})`}</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
        <TabsContent value="details" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[s.initiator, s.receiver].map((u, i) => (
              <Card key={u.id}>
                <CardHeader><CardTitle className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{i === 0 ? 'Requester' : 'Offer owner'}{u.id === other.id ? '' : ' (you)'}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-3"><UserAvatar name={u.name} image={u.image} verified={u.verified} /><div><p className="font-semibold">{u.name}</p><p className="text-xs text-[var(--color-text-muted)]">{[u.city, u.country].filter(Boolean).join(', ')}</p></div></div>
                  <TrustBadges user={u} />
                  <p className="text-xs text-[var(--color-text-secondary)]">{(i === 0 ? s.iAm === 'INITIATOR' ? s.myConfirmed : s.otherConfirmed : s.iAm === 'RECEIVER' ? s.myConfirmed : s.otherConfirmed) ? '✓ Confirmed exchange' : 'Not yet confirmed'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {s.agreed && <p className="mt-4 text-xs text-[var(--color-text-muted)]">Agreed {formatDateTime(s.agreed.agreedAt)}. These terms are frozen — later changes to the offer don&apos;t affect this swap.</p>}
          {active && <p className="mt-2 text-xs text-[var(--color-text-muted)]">CashMouver never holds or moves the money in this swap. Exchange cash in person and count it before you hand yours over.</p>}
        </TabsContent>
        <TabsContent value="meetup" className="mt-4"><MeetupPanel swap={s} /></TabsContent>
        <TabsContent value="chat" className="mt-4"><ChatPanel swapId={s.id} disabled={s.status === 'CANCELLED'} disabledReason="This swap was cancelled, so the chat is closed." /></TabsContent>
        <TabsContent value="history" className="mt-4">
          {events.isLoading ? <PageLoader /> : events.error ? <ErrorState error={events.error} /> : (
            <ol className="space-y-3 border-l-2 border-[var(--color-border)] pl-5">
              {(events.data ?? []).map((e) => (
                <li key={e.id} className="relative"><span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                  <p className="text-sm font-medium">{enumLabel(e.eventType)}{e.newStatus && e.newStatus !== e.previousStatus ? ` → ${enumLabel(e.newStatus)}` : ''}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDateTime(e.createdAt)}{e.actor && ` · ${enumLabel(e.actor)}`}</p></li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog open={dlg === 'cancel'} onOpenChange={(o) => !o && setDlg(null)} destructive title="Cancel this swap?" description="The amount is released back to the offer. Repeated cancellations can affect your trust score." reasonLabel="Reason (shared with the other member)" confirmLabel="Cancel swap"
        onConfirm={async (reason) => { await api.post(`/swaps/${id}/cancel`, { reason }); refresh() }} />
      <ConfirmDialog open={dlg === 'reject'} onOpenChange={(o) => !o && setDlg(null)} title="Decline this request?" description="The reserved amount returns to your offer." confirmLabel="Decline"
        onConfirm={async () => { await api.post(`/swaps/${id}/reject`, {}); refresh() }} />
      <ConfirmDialog open={dlg === 'confirm'} onOpenChange={(o) => !o && setDlg(null)} title="Confirm the exchange?" description="Only confirm after you have both handed over and received your cash. You can't undo this." confirmLabel="Yes, confirm"
        onConfirm={async () => { await act.mutateAsync({ path: 'confirm' }) }} />
      <DisputeDialog swapId={id} open={dlg === 'dispute'} onOpenChange={(o) => !o && setDlg(null)} />
      <ExtendDialog swapId={id} open={dlg === 'extend'} onOpenChange={(o) => !o && setDlg(null)} onDone={refresh} />
      <RatingDialog swapId={id} open={dlg === 'rate'} onOpenChange={(o) => !o && setDlg(null)} onDone={refresh} />
    </div>
  )
}
