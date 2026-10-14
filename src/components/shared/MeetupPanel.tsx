'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, CheckCircle2, LogIn, LogOut, MapPin, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { proposeMeetupSchema, type MeetupDto, type SwapDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { formatDateTime, isoToLocalInput, localToIso, enumLabel } from '@/lib/format'
import { validate, type FieldErrors } from '@/lib/form'
import { Button } from '@/components/ui/button'
import { Field, TextArea, TextInput } from '@/components/ui/field'
import { Notice, Spinner } from '@/components/ui/states'
import { EXAMPLE_CITIES } from '@/lib/constants'

function ProposeForm({ swapId, onDone, seed }: { swapId: string; onDone: () => void; seed?: MeetupDto | null }) {
  const [f, setF] = useState({
    locationName: seed?.locationName ?? '', approximateAddress: seed?.approximateAddress ?? '', exactAddress: seed?.exactAddress ?? '', privateNotes: seed?.privateNotes ?? '',
    scheduledAt: isoToLocalInput(new Date(Date.now() + 24 * 3600_000).toISOString()),
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }))
  const m = useMutation({
    mutationFn: (body: unknown) => api.post(`/swaps/${swapId}/meetups`, body),
    onSuccess: () => { toast.success('Meetup proposed'); onDone() },
    onError: (e) => toast.error(errorMessage(e)),
  })
  function submit(e: React.FormEvent) {
    e.preventDefault()
    const { data, errors: errs } = validate(proposeMeetupSchema, { ...f, exactAddress: f.exactAddress || undefined, privateNotes: f.privateNotes || undefined, scheduledAt: localToIso(f.scheduledAt) })
    setErrors(errs)
    if (data) m.mutate(data)
  }
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Place name" error={errors.locationName}><TextInput value={f.locationName} onChange={set('locationName')} placeholder={`e.g. Main station information desk, ${EXAMPLE_CITIES[1]}`} /></Field>
        <Field label="Date and time" error={errors.scheduledAt}><TextInput type="datetime-local" value={f.scheduledAt} onChange={set('scheduledAt')} /></Field>
        <Field label="General area (shown to both of you now)" error={errors.approximateAddress}><TextInput value={f.approximateAddress} onChange={set('approximateAddress')} placeholder="Street or district" /></Field>
        <Field label="Exact address (optional)" error={errors.exactAddress} hint="Revealed to the other member only once they accept."><TextInput value={f.exactAddress} onChange={set('exactAddress')} /></Field>
      </div>
      <Field label="Private notes (optional)" error={errors.privateNotes} hint="Shared only after acceptance, e.g. what you'll be wearing."><TextArea value={f.privateNotes} onChange={set('privateNotes')} maxLength={500} /></Field>
      <Notice tone="info">Choose a busy public place. Proposing a new time replaces any earlier proposal.</Notice>
      <Button type="submit" disabled={m.isPending}>{m.isPending ? 'Sending…' : 'Propose meetup'}</Button>
    </form>
  )
}

export function MeetupPanel({ swap }: { swap: SwapDto }) {
  const qc = useQueryClient()
  const [proposing, setProposing] = useState(false)
  const q = useQuery({ queryKey: ['meetup', swap.id], queryFn: () => api.get<MeetupDto | null>(`/swaps/${swap.id}/meetup`) })
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['meetup', swap.id] }); void qc.invalidateQueries({ queryKey: ['swap', swap.id] }); setProposing(false) }
  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'cancel' | 'check-in' | 'check-out' }) => api.post<MeetupDto>(`/swaps/meetups/${id}/${action}`),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  })
  const m = q.data
  const open = ['AGREED', 'IN_PROGRESS'].includes(swap.status)
  const canPropose = swap.allowedActions.includes('PROPOSE_MEETUP')

  if (q.isLoading) return <Spinner />
  return (
    <div className="space-y-4">
      {m ? (
        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 font-semibold"><MapPin size={16} className="text-[var(--color-primary)]" /> {m.locationName}</p>
            <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-0.5 text-xs font-semibold">{enumLabel(m.status)}</span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{m.approximateAddress}</p>
          <p className="mt-2 flex items-center gap-2 text-sm"><CalendarClock size={14} /> {formatDateTime(m.scheduledAt)}</p>
          {m.status === 'ACCEPTED' || m.status === 'RESCHEDULED' ? (
            <div className="mt-3 space-y-1 rounded-lg bg-[var(--color-bg)] p-3 text-sm">
              <p><strong>Exact spot:</strong> {m.exactAddress ?? 'Not provided — ask in chat'}</p>
              {m.privateNotes && <p><strong>Notes:</strong> {m.privateNotes}</p>}
              {m.latitude !== null && m.longitude !== null && <a className="text-[var(--color-primary)] underline" target="_blank" rel="noopener noreferrer" href={`https://www.openstreetmap.org/?mlat=${m.latitude}&mlon=${m.longitude}#map=17/${m.latitude}/${m.longitude}`}>Open map</a>}
              <p className="text-xs text-[var(--color-text-muted)]">Visible only to you and the other member.</p>
            </div>
          ) : <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]"><ShieldAlert size={12} /> The exact address is revealed once the meetup is accepted.</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {m.status === 'PROPOSED' || m.status === 'COUNTER_PROPOSED' ? (
              <>
                {!m.proposedByMe && <Button onClick={() => act.mutate({ id: m.id, action: 'accept' })} disabled={act.isPending}><CheckCircle2 size={14} /> Accept</Button>}
                {m.proposedByMe && <p className="self-center text-sm text-[var(--color-text-secondary)]">Waiting for the other member to respond.</p>}
                {canPropose && !m.proposedByMe && <Button variant="outline" onClick={() => setProposing(true)}>Suggest another time or place</Button>}
                <Button variant="ghost" onClick={() => act.mutate({ id: m.id, action: 'cancel' })} disabled={act.isPending}>{m.proposedByMe ? 'Withdraw' : 'Decline'}</Button>
              </>
            ) : null}
            {['ACCEPTED', 'RESCHEDULED'].includes(m.status) && open && (
              <>
                {!m.myCheckedInAt ? <Button variant="outline" onClick={() => act.mutate({ id: m.id, action: 'check-in' })} disabled={act.isPending}><LogIn size={14} /> I&apos;ve arrived</Button> : <span className="self-center text-sm text-[var(--color-success-text)]">You checked in {formatDateTime(m.myCheckedInAt)}</span>}
                {m.myCheckedInAt && !m.myCheckedOutAt && <Button variant="outline" onClick={() => act.mutate({ id: m.id, action: 'check-out' })} disabled={act.isPending}><LogOut size={14} /> I&apos;ve left</Button>}
                {canPropose && <Button variant="ghost" onClick={() => setProposing(true)}>Reschedule</Button>}
                <Button variant="ghost" onClick={() => act.mutate({ id: m.id, action: 'cancel' })} disabled={act.isPending}>Cancel meetup</Button>
              </>
            )}
          </div>
          {m.otherCheckedInAt && <p className="mt-2 text-xs text-[var(--color-text-secondary)]">The other member checked in {formatDateTime(m.otherCheckedInAt)}.</p>}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)]">{open ? 'No meetup planned yet.' : 'No meetup was planned for this swap.'}</p>
      )}
      {proposing || (!m && canPropose) ? <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4"><ProposeForm swapId={swap.id} onDone={refresh} seed={m} /></div> : null}
    </div>
  )
}
