'use client'
import { use, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, errorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { enumLabel, formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Field, NativeSelect, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { ErrorState, PageLoader } from '@/components/ui/states'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Kv } from '@/components/admin/bits'

interface AdminUser {
  id: string; email: string; name: string; role: string; phone: string | null; phoneVerified: boolean; emailVerified: boolean; twoFactorEnabled: boolean
  verificationStatus: string; verificationTier: string; businessVerified: boolean; planTier: string; country: string | null; city: string | null
  trustScore: number; rating: number; totalSwaps: number; successfulSwaps: number; createdAt: string
  isBanned: boolean; banReason: string | null; isSuspended: boolean; suspensionReason: string | null; tradingRestricted: boolean
  counts: { swaps: number; offers: number; disputes: number; openRiskFlags: number }
}
type Action = 'ban' | 'unban' | 'suspend' | 'unsuspend' | 'restrict' | 'unrestrict' | 'partner'

export default function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const me = useAuthStore((s) => s.user)!
  const qc = useQueryClient()
  const [action, setAction] = useState<Action | null>(null)
  const [until, setUntil] = useState('')
  const [role, setRole] = useState('')
  const q = useQuery({ queryKey: ['admin', 'user', id], queryFn: () => api.get<AdminUser>(`/admin/users/${id}`) })
  const done = () => { void qc.invalidateQueries({ queryKey: ['admin', 'user', id] }); toast.success('Done') }

  const roleChange = useMutation({
    mutationFn: (reason: string) => api.post(`/admin/users/${id}/role`, { role, reason }),
    onSuccess: done, onError: (e) => toast.error(errorMessage(e)),
  })
  const [roleOpen, setRoleOpen] = useState(false)

  if (q.isLoading) return <PageLoader />
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const u = q.data
  const isAdmin = me.role === 'ADMIN' || me.role === 'SUPER_ADMIN'
  const copy: Record<Action, { title: string; label: string; destructive?: boolean }> = {
    ban: { title: 'Ban this member?', label: 'Ban', destructive: true }, unban: { title: 'Lift the ban?', label: 'Unban' },
    suspend: { title: 'Suspend this member?', label: 'Suspend', destructive: true }, unsuspend: { title: 'Lift the suspension?', label: 'Unsuspend' },
    restrict: { title: 'Restrict trading?', label: 'Restrict', destructive: true }, unrestrict: { title: 'Allow trading again?', label: 'Allow' },
    partner: { title: 'Make this member a referral partner?', label: 'Confirm' },
  }
  async function run(reason: string) {
    if (!action) return
    const path = action === 'restrict' || action === 'unrestrict' ? 'trading-restriction' : action
    const body: Record<string, unknown> = { reason }
    if ((action === 'ban' || action === 'suspend') && until) body.until = new Date(until).toISOString()
    if (action === 'restrict' || action === 'unrestrict') body.restricted = action === 'restrict'
    if (action === 'partner') { delete body.reason; body.isPartner = true }
    await api.post(`/admin/users/${id}/${path}`, body)
    setUntil(''); done()
  }
  return (
    <div className="max-w-3xl">
      <PageHeader title={u.name} description={u.email} />
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusBadge label={enumLabel(u.role)} variant="primary" />
        {u.isBanned && <StatusBadge label="Banned" variant="error" />}
        {u.isSuspended && <StatusBadge label="Suspended" variant="warning" />}
        {u.tradingRestricted && <StatusBadge label="Trading restricted" variant="warning" />}
      </div>
      <dl className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <Kv k="Joined" v={formatDateTime(u.createdAt)} /><Kv k="Location" v={[u.city, u.country].filter(Boolean).join(', ') || '—'} />
        <Kv k="Email verified" v={u.emailVerified ? 'Yes' : 'No'} /><Kv k="Phone" v={u.phone ? `${u.phone} (${u.phoneVerified ? 'verified' : 'unverified'})` : '—'} /><Kv k="2FA" v={u.twoFactorEnabled ? 'On' : 'Off'} />
        <Kv k="Verification" v={`${enumLabel(u.verificationStatus)} · ${enumLabel(u.verificationTier)}${u.businessVerified ? ' · business verified' : ''}`} /><Kv k="Plan" v={enumLabel(u.planTier)} />
        <Kv k="Trust / rating" v={`${u.trustScore} / ${u.rating.toFixed(1)}`} /><Kv k="Swaps" v={`${u.successfulSwaps} completed of ${u.totalSwaps}`} />
        <Kv k="Offers · disputes · open risk flags" v={`${u.counts.offers} · ${u.counts.disputes} · ${u.counts.openRiskFlags}`} />
        {u.banReason && <Kv k="Ban reason" v={u.banReason} />}{u.suspensionReason && <Kv k="Suspension reason" v={u.suspensionReason} />}
      </dl>

      {u.id === me.id ? <p className="text-sm text-[var(--color-text-secondary)]">You can&apos;t take actions on your own account.</p> : (
        <section className="space-y-4">
          <h2 className="text-lg">Actions</h2>
          <p className="text-xs text-[var(--color-text-muted)]">Every action requires a reason and is written to the audit log. You can only act on members below your own role.</p>
          <Field label="Until (optional, for ban / suspend)" className="max-w-xs"><TextInput type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} /></Field>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (u.isBanned ? <Button variant="outline" onClick={() => setAction('unban')}>Unban</Button> : <Button variant="outline" onClick={() => setAction('ban')}>Ban</Button>)}
            {u.isSuspended ? <Button variant="outline" onClick={() => setAction('unsuspend')}>Unsuspend</Button> : <Button variant="outline" onClick={() => setAction('suspend')}>Suspend</Button>}
            {u.tradingRestricted ? <Button variant="outline" onClick={() => setAction('unrestrict')}>Allow trading</Button> : <Button variant="outline" onClick={() => setAction('restrict')}>Restrict trading</Button>}
            {isAdmin && <Button variant="outline" onClick={() => setAction('partner')}>Make referral partner</Button>}
          </div>
          {me.role === 'SUPER_ADMIN' && (
            <div className="flex items-end gap-3"><Field label="Change role"><NativeSelect value={role} onChange={(e) => setRole(e.target.value)}><option value="">Select…</option>{['USER', 'STAFF', 'ADMIN'].map((r) => <option key={r} value={r}>{enumLabel(r)}</option>)}</NativeSelect></Field>
              <Button variant="outline" disabled={!role || role === u.role} onClick={() => setRoleOpen(true)}>Apply</Button></div>
          )}
        </section>
      )}
      {action && <ConfirmDialog open onOpenChange={(o) => !o && setAction(null)} title={copy[action].title} confirmLabel={copy[action].label} destructive={copy[action].destructive}
        reasonLabel={action === 'partner' ? undefined : 'Reason (recorded in the audit log)'} reasonMin={5} onConfirm={run} />}
      <ConfirmDialog open={roleOpen} onOpenChange={setRoleOpen} title={`Change role to ${enumLabel(role || '')}?`} confirmLabel="Change role" reasonLabel="Reason" reasonMin={5} onConfirm={(r) => roleChange.mutateAsync(r)} />
    </div>
  )
}
