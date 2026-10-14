'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { NOTIFICATION_TYPES, SUPPORTED_LOCALES } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { enumLabel } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, NativeSelect, TextArea, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ErrorState, Notice } from '@/components/ui/states'

interface Tpl { id: string; type: string; locale: string; titleTemplate: string; bodyTemplate: string; isActive: boolean }
const blank = { type: 'SWAP_REQUEST', locale: 'en', titleTemplate: '', bodyTemplate: '', isActive: true }

export default function AdminTemplates() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['admin', 'templates'], queryFn: () => api.get<Tpl[]>('/admin/templates') })
  const [f, setF] = useState<typeof blank | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const save = useMutation({ mutationFn: (b: unknown) => api.put('/admin/templates', b), onSuccess: () => { toast.success('Saved'); setF(null); void qc.invalidateQueries({ queryKey: ['admin', 'templates'] }) }, onError: (e) => setErr(errorMessage(e)) })
  const cols: Column<Tpl>[] = [
    { key: 't', header: 'Type', render: (t) => <span>{enumLabel(t.type)} <span className="text-xs text-[var(--color-text-muted)]">({t.locale})</span></span> },
    { key: 'ti', header: 'Title', render: (t) => t.titleTemplate }, { key: 'b', header: 'Body', render: (t) => <span className="line-clamp-2 max-w-md text-xs">{t.bodyTemplate}</span> },
    { key: 's', header: 'Status', render: (t) => <StatusBadge label={t.isActive ? 'Active' : 'Off'} variant={t.isActive ? 'success' : 'neutral'} /> },
    { key: 'x', header: '', render: (t) => <Button size="sm" variant="outline" onClick={() => { setErr(null); setF({ type: t.type, locale: t.locale, titleTemplate: t.titleTemplate, bodyTemplate: t.bodyTemplate, isActive: t.isActive }) }}>Edit</Button> },
  ]
  return (
    <div>
      <PageHeader title="Notification templates" description="Wording of in-app, push and email notices." actions={<Button onClick={() => { setErr(null); setF(blank) }}>New template</Button>} />
      <Notice tone="info" className="mb-5">Placeholders use single braces, e.g. <code>{'{name}'}</code> and <code>{'{amount}'}</code>. Reuse the placeholders the built-in text for the same type uses; an unknown one is shown as typed.</Notice>
      {f && (
        <form className="mb-6 space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5" onSubmit={(e) => { e.preventDefault(); save.mutate(f) }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type"><NativeSelect value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{NOTIFICATION_TYPES.map((t) => <option key={t} value={t}>{enumLabel(t)}</option>)}</NativeSelect></Field>
            <Field label="Language"><NativeSelect value={f.locale} onChange={(e) => setF({ ...f, locale: e.target.value })}>{SUPPORTED_LOCALES.map((l) => <option key={l} value={l}>{l}</option>)}</NativeSelect></Field>
          </div>
          <Field label="Title"><TextInput maxLength={200} value={f.titleTemplate} onChange={(e) => setF({ ...f, titleTemplate: e.target.value })} /></Field>
          <Field label="Body"><TextArea maxLength={1000} value={f.bodyTemplate} onChange={(e) => setF({ ...f, bodyTemplate: e.target.value })} /></Field>
          <Checkbox checked={f.isActive} onChange={(v) => setF({ ...f, isActive: v })}>Active</Checkbox>
          {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-2"><Button type="submit" disabled={save.isPending || !f.titleTemplate || !f.bodyTemplate}>Save</Button><Button type="button" variant="ghost" onClick={() => setF(null)}>Cancel</Button></div>
        </form>
      )}
      {q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : <DataTable columns={cols} data={q.data ?? []} keyFn={(t) => t.id} isLoading={q.isLoading} />}
    </div>
  )
}
