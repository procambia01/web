'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, KeyRound, RefreshCw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { API_SCOPES, apiKeyCreateSchema, type ApiKeyCreatedDto, type ApiKeyDto, type ApiKeyUsageDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { withReauth } from '@/store/reauth.store'
import { validate } from '@/lib/form'
import { formatDate, formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Field, TextInput, Checkbox } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState, ErrorState, Notice, PageLoader } from '@/components/ui/states'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useEntitlements } from '@/hooks/usePlan'

function Usage({ id }: { id: string }) {
  const q = useQuery({ queryKey: ['api-key-usage', id], queryFn: () => api.get<ApiKeyUsageDto>(`/developer/keys/${id}/usage`, { days: 14 }) })
  if (q.isLoading) return <p className="text-xs text-[var(--color-text-muted)]">Loading usage…</p>
  if (q.error || !q.data) return <p className="text-xs text-red-600">{errorMessage(q.error)}</p>
  const max = Math.max(1, ...q.data.days.map((d) => d.count))
  return (
    <div className="mt-3">
      <p className="text-xs text-[var(--color-text-secondary)]">{q.data.usedThisMonth.toLocaleString()} / {q.data.monthlyQuota.toLocaleString()} requests this month</p>
      <div className="mt-2 flex h-14 items-end gap-1" aria-label="Requests per day, last 14 days">
        {q.data.days.map((d) => <div key={d.day} title={`${d.day}: ${d.count} requests, ${d.errors} errors`} className="flex-1 rounded-t bg-[var(--color-primary)]/70" style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }} />)}
      </div>
    </div>
  )
}

export default function DeveloperPage() {
  const qc = useQueryClient()
  const ent = useEntitlements()
  const keys = useQuery({ queryKey: ['api-keys'], queryFn: () => api.get<ApiKeyDto[]>('/developer/keys') })
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>(['rates:read', 'offers:read'])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [secret, setSecret] = useState<ApiKeyCreatedDto | null>(null)
  const [revoke, setRevoke] = useState<ApiKeyDto | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: (body: unknown) => withReauth(() => api.post<ApiKeyCreatedDto>('/developer/keys', body)),
    onSuccess: (k) => { setSecret(k); setName(''); void qc.invalidateQueries({ queryKey: ['api-keys'] }) },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const rotate = useMutation({
    mutationFn: (id: string) => withReauth(() => api.post<ApiKeyCreatedDto>(`/developer/keys/${id}/rotate`)),
    onSuccess: (k) => { setSecret(k); void qc.invalidateQueries({ queryKey: ['api-keys'] }) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const { data, errors } = validate(apiKeyCreateSchema, { name, scopes })
    setErrors(errors)
    if (data) create.mutate(data)
  }
  const planOk = ent.data ? ent.data.features?.apiAccess !== false : true

  return (
    <div>
      <PageHeader title="Developer API" description="Read-only access to public marketplace data: rates, public offers and aggregated market statistics. Private user data is never exposed." />
      {!planOk && <Notice tone="warning" className="mb-6">API keys need a Business plan.</Notice>}

      {secret && (
        <Notice tone="success" className="mb-6">
          <p className="font-semibold">Copy your key now — it will not be shown again.</p>
          <div className="mt-2 flex items-center gap-2"><code className="break-all rounded bg-black/10 px-2 py-1 text-xs">{secret.key}</code>
            <Button size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(secret.key); toast.success('Copied') }}><Copy size={14} /></Button></div>
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setSecret(null)}>I&apos;ve saved it</Button>
        </Notice>
      )}

      <form onSubmit={submit} className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-3 text-lg">New key</h2>
        <Field label="Name" error={errors.name}><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rates widget" invalid={!!errors.name} /></Field>
        <fieldset className="mt-3"><legend className="mb-1 text-sm font-medium">Scopes</legend>
          <div className="flex flex-wrap gap-4">{API_SCOPES.map((s) => <Checkbox key={s} checked={scopes.includes(s)} onChange={(v) => setScopes((x) => v ? [...x, s] : x.filter((y) => y !== s))}>{s}</Checkbox>)}</div>
          {errors.scopes && <p className="mt-1 text-xs text-red-600">{errors.scopes}</p>}
        </fieldset>
        <Button type="submit" className="mt-4" disabled={create.isPending}><KeyRound size={14} className="mr-1.5" />{create.isPending ? 'Creating…' : 'Create key'}</Button>
      </form>

      {keys.isLoading ? <PageLoader /> : keys.error ? <ErrorState error={keys.error} onRetry={() => keys.refetch()} /> : !keys.data?.length ? <EmptyState title="No API keys" description="Create one above." /> : (
        <ul className="space-y-3">
          {keys.data.map((k) => (
            <li key={k.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{k.name} <StatusBadge label={k.revokedAt ? 'Revoked' : k.isActive ? 'Active' : 'Inactive'} variant={k.isActive && !k.revokedAt ? 'success' : 'neutral'} /></p>
                  <p className="text-xs text-[var(--color-text-secondary)]"><code>{k.keyPrefix}…</code> · {k.scopes.join(', ')} · {k.rateLimitPerMinute}/min · created {formatDate(k.createdAt)} · {k.lastUsedAt ? `last used ${formatDateTime(k.lastUsedAt)}` : 'never used'}</p>
                </div>
                {!k.revokedAt && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setOpen(open === k.id ? null : k.id)}>Usage</Button>
                    <Button size="sm" variant="outline" disabled={rotate.isPending} onClick={() => rotate.mutate(k.id)}><RefreshCw size={14} className="mr-1" />Rotate</Button>
                    <Button size="sm" variant="outline" onClick={() => setRevoke(k)}><Trash2 size={14} className="mr-1" />Revoke</Button>
                  </div>
                )}
              </div>
              {open === k.id && <Usage id={k.id} />}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={!!revoke} onOpenChange={(o) => !o && setRevoke(null)} title="Revoke this key?" description="Applications using it will stop working immediately." confirmLabel="Revoke" destructive
        onConfirm={async () => { if (revoke) { await withReauth(() => api.del(`/developer/keys/${revoke.id}`)); toast.success('Key revoked'); void qc.invalidateQueries({ queryKey: ['api-keys'] }) } }} />
      <p className="mt-6 text-xs text-[var(--color-text-muted)]">Send the key in the <code>X-API-Key</code> header.</p>
    </div>
  )
}
