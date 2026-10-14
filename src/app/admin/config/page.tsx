'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, errorMessage } from '@/lib/api'
import { enumLabel } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Field, NativeSelect, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { ErrorState, PageLoader } from '@/components/ui/states'

interface Setting { key: string; value: string; dataType: string; description: string; category: string; isPublic: boolean }

function Row({ s }: { s: Setting }) {
  const qc = useQueryClient()
  const [v, setV] = useState(s.value)
  const [reason, setReason] = useState('')
  const save = useMutation({ mutationFn: () => api.put(`/admin/config/${s.key}`, { value: v, reason: reason || undefined }), onSuccess: () => { toast.success(`${s.key} saved`); setReason(''); void qc.invalidateQueries({ queryKey: ['admin', 'config'] }); void qc.invalidateQueries({ queryKey: ['config'] }) }, onError: (e) => toast.error(errorMessage(e)) })
  return (
    <li className="grid items-end gap-3 border-b border-[var(--color-border)] py-3 sm:grid-cols-[1fr_12rem_12rem_auto]">
      <div><p className="font-mono text-xs">{s.key}</p><p className="text-sm text-[var(--color-text-secondary)]">{s.description}</p></div>
      {s.dataType === 'bool' ? <Field label="Value"><NativeSelect value={v} onChange={(e) => setV(e.target.value)}><option value="true">true</option><option value="false">false</option></NativeSelect></Field>
        : <Field label="Value"><TextInput value={v} inputMode={s.dataType === 'int' ? 'numeric' : undefined} onChange={(e) => setV(e.target.value)} /></Field>}
      <Field label="Reason"><TextInput value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <Button size="sm" disabled={v === s.value || save.isPending} onClick={() => save.mutate()}>Save</Button>
    </li>
  )
}

export default function AdminConfig() {
  const q = useQuery({ queryKey: ['admin', 'config'], queryFn: () => api.get<Setting[]>('/admin/config') })
  if (q.isLoading) return <PageLoader />
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const groups = new Map<string, Setting[]>()
  for (const s of q.data) groups.set(s.category, [...(groups.get(s.category) ?? []), s])
  return (
    <div>
      <PageHeader title="Platform settings" description="Runtime configuration. Changes are audit-logged and take effect within a minute." />
      {[...groups.entries()].map(([cat, items]) => (
        <section key={cat} className="mb-8"><h2 className="mb-1 text-lg">{enumLabel(cat)}</h2><ul>{items.map((s) => <Row key={s.key} s={s} />)}</ul></section>
      ))}
    </div>
  )
}
