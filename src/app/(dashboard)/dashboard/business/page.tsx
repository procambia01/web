'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { api, ApiError, errorMessage } from '@/lib/api'
import { validate } from '@/lib/form'
import { countryOptions } from '@/lib/countries'
import { enumLabel, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Field, NativeSelect, TextArea, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { ErrorState, Notice, PageLoader } from '@/components/ui/states'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

interface BusinessProfile { legalName: string; tradingName: string | null; country: string; registrationNumber: string | null; website: string | null; description: string | null; verified: boolean }
interface Member { id: string; role: string; status: string; invitedAt: string; member: { id: string; name: string; email: string } | null }

const profileSchema = z.object({
  legalName: z.string().trim().min(2, 'Enter the legal name').max(200),
  tradingName: z.string().trim().max(200).optional(),
  country: z.string().length(2, 'Choose a country'),
  registrationNumber: z.string().trim().max(100).optional(),
  website: z.string().url('Enter a full https:// address').startsWith('https://', 'Must start with https://').optional(),
  description: z.string().trim().max(1000).optional(),
})
const inviteSchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email'), role: z.enum(['MEMBER', 'MANAGER']) })

export default function BusinessPage() {
  const qc = useQueryClient()
  const profile = useQuery({ queryKey: ['business'], queryFn: () => api.get<BusinessProfile | null>('/users/me/business') })
  const team = useQuery({ queryKey: ['business-team'], queryFn: () => api.get<Member[]>('/users/me/business/team'), retry: false })
  const [f, setF] = useState<Record<string, string> | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('MEMBER')
  const [remove, setRemove] = useState<Member | null>(null)

  const form = f ?? { legalName: profile.data?.legalName ?? '', tradingName: profile.data?.tradingName ?? '', country: profile.data?.country ?? '', registrationNumber: profile.data?.registrationNumber ?? '', website: profile.data?.website ?? '', description: profile.data?.description ?? '' }
  const set = (k: string, v: string) => setF({ ...form, [k]: v })

  const save = useMutation({
    mutationFn: (b: unknown) => api.put('/users/me/business', b),
    onSuccess: () => { toast.success('Business profile saved'); setF(null); void qc.invalidateQueries({ queryKey: ['business'] }) },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const invite = useMutation({
    mutationFn: (b: unknown) => api.post('/users/me/business/team', b),
    onSuccess: () => { toast.success('Invitation sent'); setEmail(''); void qc.invalidateQueries({ queryKey: ['business-team'] }) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const planRequired = (profile.error instanceof ApiError && profile.error.code === 'PLAN_REQUIRED') || (team.error instanceof ApiError && team.error.code === 'PLAN_REQUIRED')

  function submitProfile(e: React.FormEvent) {
    e.preventDefault()
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() === '' ? undefined : v.trim()]))
    const { data, errors } = validate(profileSchema, clean)
    setErrors(errors)
    if (data) save.mutate(data)
  }

  if (profile.isLoading) return <PageLoader />
  return (
    <div>
      <PageHeader title="Business" description="Your business profile, team and verification." />
      {planRequired && <Notice tone="warning" className="mb-6">Business tools need a Business plan. <Link className="font-semibold underline" href="/dashboard/premium">See plans</Link></Notice>}
      {profile.error && !planRequired && <ErrorState error={profile.error} onRetry={() => profile.refetch()} />}

      <form onSubmit={submitProfile} className="mb-10 space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center justify-between"><h2 className="text-lg">Business profile</h2>
          {profile.data && <StatusBadge label={profile.data.verified ? 'Verified business' : 'Not verified'} variant={profile.data.verified ? 'success' : 'neutral'} />}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Legal name" error={errors.legalName}><TextInput value={form.legalName} onChange={(e) => set('legalName', e.target.value)} invalid={!!errors.legalName} /></Field>
          <Field label="Trading name" error={errors.tradingName}><TextInput value={form.tradingName} onChange={(e) => set('tradingName', e.target.value)} /></Field>
          <Field label="Country" error={errors.country}><NativeSelect value={form.country} onChange={(e) => set('country', e.target.value)} invalid={!!errors.country}><option value="">Select…</option>{countryOptions().map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</NativeSelect></Field>
          <Field label="Registration number" error={errors.registrationNumber}><TextInput value={form.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)} /></Field>
        </div>
        <Field label="Website" error={errors.website}><TextInput value={form.website} placeholder="https://" onChange={(e) => set('website', e.target.value)} invalid={!!errors.website} /></Field>
        <Field label="Description" error={errors.description}><TextArea value={form.description} maxLength={1000} onChange={(e) => set('description', e.target.value)} /></Field>
        <div className="flex items-center gap-3"><Button type="submit" disabled={save.isPending || planRequired}>{save.isPending ? 'Saving…' : 'Save profile'}</Button>
          {profile.data && !profile.data.verified && <Link className="text-sm underline" href="/dashboard/verification">Get your business verified</Link>}</div>
      </form>

      <section>
        <h2 className="mb-3 text-lg">Team</h2>
        <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); const { data, errors } = validate(inviteSchema, { email, role }); setErrors(errors); if (data) invite.mutate(data) }}>
          <Field label="Email" error={errors.email} className="min-w-64 flex-1"><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} /></Field>
          <Field label="Role"><NativeSelect value={role} onChange={(e) => setRole(e.target.value)}><option value="MEMBER">Member</option><option value="MANAGER">Manager</option></NativeSelect></Field>
          <Button type="submit" disabled={invite.isPending || planRequired}>Invite</Button>
        </form>
        {team.isLoading ? <PageLoader /> : (
          <ul className="space-y-2">
            {(team.data ?? []).map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
                <span><strong>{m.member?.name ?? 'Unknown'}</strong> <span className="text-[var(--color-text-muted)]">{m.member?.email}</span> · {enumLabel(m.role)} · <StatusBadge label={enumLabel(m.status)} variant={m.status === 'ACTIVE' ? 'success' : 'neutral'} /> · invited {formatDate(m.invitedAt)}</span>
                <Button size="sm" variant="outline" onClick={() => setRemove(m)}>Remove</Button>
              </li>
            ))}
            {!team.error && !team.data?.length && <li className="text-sm text-[var(--color-text-secondary)]">No team members yet.</li>}
          </ul>
        )}
      </section>
      <ConfirmDialog open={!!remove} onOpenChange={(o) => !o && setRemove(null)} title="Remove team member?" confirmLabel="Remove" destructive
        onConfirm={async () => { if (remove) { await api.del(`/users/me/business/team/${remove.member?.id ?? remove.id}`); toast.success('Removed'); void qc.invalidateQueries({ queryKey: ['business-team'] }) } }} />
    </div>
  )
}
