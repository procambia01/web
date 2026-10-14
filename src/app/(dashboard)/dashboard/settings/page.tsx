'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Smartphone, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { changePasswordSchema, phoneOtpRequestSchema, phoneOtpVerifySchema, type PublicUserDto } from '@/contracts'
import { api, authCall, errorMessage, tokenStore } from '@/lib/api'
import { withReauth } from '@/store/reauth.store'
import { useAuthStore } from '@/store/auth.store'
import { validate } from '@/lib/form'
import { formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Field, Switch, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Notice } from '@/components/ui/states'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

interface Session { id: string; deviceName: string | null; ipAddress: string | null; userAgent: string | null; createdAt: string; lastUsedAt: string; current: boolean }
type Person = PublicUserDto & { blockedAt?: string; notes?: string | null }

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"><h2 className="mb-3 text-lg">{title}</h2>{children}</section>
)

function PasswordForm() {
  const [v, setV] = useState({ currentPassword: '', newPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const m = useMutation({
    mutationFn: (b: { currentPassword: string; newPassword: string }) => authCall<{ tokens?: { accessToken: string; accessTokenExpiresAt: string } }>('change-password', b),
    onSuccess: (r) => { if (r.tokens) tokenStore.set(r.tokens.accessToken, r.tokens.accessTokenExpiresAt); toast.success('Password changed. Other devices were signed out.'); setV({ currentPassword: '', newPassword: '' }) },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const { data, errors } = validate(changePasswordSchema, v); setErrors(errors); if (data) m.mutate(data) }}>
      <Field label="Current password" error={errors.currentPassword}><TextInput type="password" autoComplete="current-password" value={v.currentPassword} onChange={(e) => setV({ ...v, currentPassword: e.target.value })} invalid={!!errors.currentPassword} /></Field>
      <Field label="New password" error={errors.newPassword} hint="At least 8 characters with upper, lower case and a number."><TextInput type="password" autoComplete="new-password" value={v.newPassword} onChange={(e) => setV({ ...v, newPassword: e.target.value })} invalid={!!errors.newPassword} /></Field>
      <div><Button type="submit" disabled={m.isPending}>{m.isPending ? 'Changing…' : 'Change password'}</Button></div>
    </form>
  )
}

function TwoFactor() {
  const me = useAuthStore((s) => s.user)!
  const refresh = useAuthStore((s) => s.refreshUser)
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null)
  const [code, setCode] = useState('')
  const [disable, setDisable] = useState({ open: false, password: '', code: '' })
  const start = useMutation({ mutationFn: () => withReauth(() => api.post<{ secret: string; otpauthUrl: string }>('/auth/2fa/setup')), onSuccess: setSetup, onError: (e) => toast.error(errorMessage(e)) })
  const enable = useMutation({
    mutationFn: () => api.post('/auth/2fa/enable', { code }),
    onSuccess: async () => { toast.success('Two-factor authentication is on'); setSetup(null); setCode(''); await refresh() },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const off = useMutation({
    mutationFn: () => api.post('/auth/2fa/disable', { password: disable.password, code: disable.code }),
    onSuccess: async () => { toast.success('Two-factor authentication is off'); setDisable({ open: false, password: '', code: '' }); await refresh() },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-sm"><ShieldCheck size={16} />Authenticator-app codes at sign-in. <StatusBadge label={me.twoFactorEnabled ? 'On' : 'Off'} variant={me.twoFactorEnabled ? 'success' : 'neutral'} /></p>
      {!me.twoFactorEnabled && !setup && <Button variant="outline" disabled={start.isPending} onClick={() => start.mutate()}>Set up</Button>}
      {setup && (
        <div className="space-y-3 text-sm">
          <p>Add this key to your authenticator app (Google Authenticator, 1Password, Authy…), then enter the 6-digit code.</p>
          <p><code className="break-all rounded bg-[var(--color-bg)] px-2 py-1">{setup.secret}</code></p>
          <p><a className="underline" href={setup.otpauthUrl}>Open in authenticator app</a></p>
          <div className="flex items-end gap-3"><Field label="Code"><TextInput inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></Field>
            <Button disabled={code.length !== 6 || enable.isPending} onClick={() => enable.mutate()}>Turn on</Button></div>
        </div>
      )}
      {me.twoFactorEnabled && <Button variant="outline" onClick={() => setDisable({ ...disable, open: true })}>Turn off</Button>}
      {disable.open && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field label="Password"><TextInput type="password" value={disable.password} onChange={(e) => setDisable({ ...disable, password: e.target.value })} /></Field>
          <Field label="Authenticator code"><TextInput inputMode="numeric" value={disable.code} onChange={(e) => setDisable({ ...disable, code: e.target.value })} /></Field>
          <Button disabled={!disable.password || !disable.code || off.isPending} onClick={() => off.mutate()}>Confirm</Button>
          <Button variant="ghost" onClick={() => setDisable({ open: false, password: '', code: '' })}>Cancel</Button>
        </div>
      )}
    </div>
  )
}

function Phone() {
  const me = useAuthStore((s) => s.user)!
  const refresh = useAuthStore((s) => s.refreshUser)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const req = useMutation({ mutationFn: (b: unknown) => api.post('/users/me/phone/request-otp', b), onSuccess: () => { setSent(true); toast.success('Code sent by SMS') }, onError: (e) => toast.error(errorMessage(e)) })
  const verify = useMutation({ mutationFn: (b: unknown) => api.post('/users/me/phone/verify-otp', b), onSuccess: async () => { toast.success('Phone verified'); setSent(false); setCode(''); await refresh() }, onError: (e) => toast.error(errorMessage(e)) })
  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-sm"><Smartphone size={16} />{me.phone ?? 'No phone number'} {me.phone && <StatusBadge label={me.phoneVerified ? 'Verified' : 'Unverified'} variant={me.phoneVerified ? 'success' : 'warning'} />}</p>
      {!me.phoneVerified && (
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Phone (international format)" error={errors.phone}><TextInput placeholder="+44 20 7946 0958" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))} invalid={!!errors.phone} /></Field>
          <Button variant="outline" disabled={req.isPending} onClick={() => { const { data, errors } = validate(phoneOtpRequestSchema, { phone }); setErrors(errors); if (data) req.mutate(data) }}>{sent ? 'Resend code' : 'Send code'}</Button>
          {sent && <><Field label="6-digit code" error={errors.code}><TextInput inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></Field>
            <Button disabled={verify.isPending} onClick={() => { const { data, errors } = validate(phoneOtpVerifySchema, { code }); setErrors(errors); if (data) verify.mutate(data) }}>Verify</Button></>}
        </div>
      )}
    </div>
  )
}

function People({ title, url, empty, action }: { title: string; url: string; empty: string; action: string }) {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: [url], queryFn: () => api.get<Person[]>(url) })
  const rm = useMutation({ mutationFn: (id: string) => api.del(`${url}/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: [url] }), onError: (e) => toast.error(errorMessage(e)) })
  return (
    <Section title={title}>
      <ul className="space-y-2 text-sm">
        {(q.data ?? []).map((p) => <li key={p.id} className="flex items-center justify-between"><Link className="underline" href={`/dashboard/members/${p.id}`}>{p.name}</Link><Button size="sm" variant="outline" disabled={rm.isPending} onClick={() => rm.mutate(p.id)}>{action}</Button></li>)}
        {!q.isLoading && !q.data?.length && <li className="text-[var(--color-text-secondary)]">{empty}</li>}
      </ul>
    </Section>
  )
}

export default function SettingsPage() {
  const me = useAuthStore((s) => s.user)!
  const setUser = useAuthStore((s) => s.setUser)
  const router = useRouter()
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: () => api.get<Session[]>('/auth/sessions') })
  const qc = useQueryClient()
  const [del, setDel] = useState(false)
  const pref = useMutation({
    mutationFn: (b: { receiveEmails?: boolean; receiveSMS?: boolean; receivePush?: boolean }) => api.patch<typeof me>('/users/me/preferences', b),
    onSuccess: setUser, onError: (e) => toast.error(errorMessage(e)),
  })
  const revoke = useMutation({ mutationFn: (id: string) => api.del(`/auth/sessions/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }), onError: (e) => toast.error(errorMessage(e)) })
  const logoutAll = useMutation({
    mutationFn: () => withReauth(() => api.post('/auth/logout-all')),
    onSuccess: async () => { await useAuthStore.getState().logout(); router.replace('/login') }, onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description={me.email} />
      {!me.emailVerified && <Notice tone="warning" className="mb-6">Your email isn&apos;t verified yet. Check your inbox for the link.</Notice>}

      <Section title="Password"><PasswordForm /></Section>
      <Section title="Two-factor authentication"><TwoFactor /></Section>
      <Section title="Phone number"><Phone /></Section>

      <Section title="Where you're signed in">
        <ul className="space-y-2 text-sm">
          {(sessions.data ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3">
              <span>{s.deviceName ?? 'Unknown device'} {s.current && <StatusBadge label="This device" variant="primary" />}<span className="block text-xs text-[var(--color-text-muted)]">{s.ipAddress} · last active {formatDateTime(s.lastUsedAt)}</span></span>
              {!s.current && <Button size="sm" variant="outline" disabled={revoke.isPending} onClick={() => revoke.mutate(s.id)}>Sign out</Button>}
            </li>
          ))}
        </ul>
        <Button className="mt-4" variant="outline" disabled={logoutAll.isPending} onClick={() => logoutAll.mutate()}>Sign out of all devices</Button>
      </Section>

      <Section title="Notifications">
        <div className="space-y-3">
          <Switch label="Email" checked={me.receiveEmails} disabled={pref.isPending} onChange={(v) => pref.mutate({ receiveEmails: v })} />
          <Switch label="SMS" checked={me.receiveSMS} disabled={pref.isPending} onChange={(v) => pref.mutate({ receiveSMS: v })} />
          <Switch label="Push" checked={me.receivePush} disabled={pref.isPending} onChange={(v) => pref.mutate({ receivePush: v })} />
        </div>
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">Security and payment notices are always sent.</p>
      </Section>

      <People title="Favourite members" url="/users/me/favorites" empty="You haven't favourited anyone." action="Remove" />
      <People title="Blocked members" url="/users/me/blocked" empty="You haven't blocked anyone." action="Unblock" />

      <Section title="Delete account">
        <p className="mb-3 text-sm text-[var(--color-text-secondary)]">Deactivates your account and removes your offers. Active swaps must be finished first. Payment records are retained as required by law.</p>
        <Button variant="outline" className="border-red-300 text-red-600" onClick={() => setDel(true)}>Delete my account</Button>
      </Section>
      <ConfirmDialog open={del} onOpenChange={setDel} title="Delete your account?" description="This cannot be undone." confirmLabel="Delete account" destructive
        onConfirm={async () => { await withReauth(() => api.del('/users/me')); tokenStore.clear(); router.replace('/') ; router.refresh() }} />
    </div>
  )
}
