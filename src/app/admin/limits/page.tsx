'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, errorMessage } from '@/lib/api'
import { decimalToMinor, minorToDecimal } from '@/lib/minor'
import { useCurrencies } from '@/hooks/useCurrencies'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { ErrorState, Notice, PageLoader } from '@/components/ui/states'
import { CurrencySelect } from '@/components/shared/CurrencySelect'

interface Policy {
  key: string; name: string; limitCurrency: string; maxSwapMinor: string; dailyMinor: string; weeklyMinor: string; monthlyMinor: string
  maxActiveOffers: number; maxActiveSwaps: number; maxRateAlerts: number; apiCallsPerMonth: number; maxBoostPurchasesMonth: number; maxTeamMembers: number
  advancedSearch: boolean; priorityMatching: boolean; advancedAnalytics: boolean; premiumBadge: boolean; prioritySupport: boolean; apiAccess: boolean
}
const AMOUNTS = [['maxSwapMinor', 'Max per swap'], ['dailyMinor', 'Daily volume'], ['weeklyMinor', 'Weekly volume'], ['monthlyMinor', 'Monthly volume']] as const
const COUNTS = [['maxActiveOffers', 'Active offers'], ['maxActiveSwaps', 'Active swaps'], ['maxRateAlerts', 'Rate alerts'], ['apiCallsPerMonth', 'API calls / month'], ['maxBoostPurchasesMonth', 'Boosts / month'], ['maxTeamMembers', 'Team members']] as const
const FLAGS = [['advancedSearch', 'Advanced search'], ['priorityMatching', 'Priority matching'], ['advancedAnalytics', 'Advanced analytics'], ['premiumBadge', 'Premium badge'], ['prioritySupport', 'Priority support'], ['apiAccess', 'API access']] as const

type Draft = Record<string, string | boolean>

export default function AdminLimits() {
  const qc = useQueryClient()
  const { minorUnit } = useCurrencies()
  const q = useQuery({ queryKey: ['admin', 'limits'], queryFn: () => api.get<Policy[]>('/admin/limit-policies') })
  const [key, setKey] = useState<string | null>(null)
  const [d, setD] = useState<Draft>({})
  const [err, setErr] = useState<string | null>(null)
  const save = useMutation({ mutationFn: (b: Record<string, unknown>) => api.put(`/admin/limit-policies/${key}`, b), onSuccess: () => { toast.success('Saved'); setKey(null); void qc.invalidateQueries({ queryKey: ['admin', 'limits'] }) }, onError: (e) => setErr(errorMessage(e)) })

  function edit(p: Policy) {
    const u = minorUnit(p.limitCurrency)
    const draft: Draft = { name: p.name, limitCurrency: p.limitCurrency, reason: '' }
    for (const [k] of AMOUNTS) draft[k] = minorToDecimal(p[k], u)
    for (const [k] of COUNTS) draft[k] = String(p[k])
    for (const [k] of FLAGS) draft[k] = p[k]
    setD(draft); setKey(p.key); setErr(null)
  }
  function submit(e: React.FormEvent) {
    e.preventDefault()
    const u = minorUnit(String(d.limitCurrency))
    const body: Record<string, unknown> = { name: d.name, limitCurrency: d.limitCurrency, reason: d.reason || undefined }
    for (const [k, l] of AMOUNTS) { const m = decimalToMinor(String(d[k]), u); if (m === null) return setErr(`${l}: enter an amount with at most ${u} decimals`); body[k] = m }
    for (const [k, l] of COUNTS) { if (!/^\d+$/.test(String(d[k]))) return setErr(`${l}: enter a whole number`); body[k] = Number(d[k]) }
    for (const [k] of FLAGS) body[k] = !!d[k]
    setErr(null); save.mutate(body)
  }
  if (q.isLoading) return <PageLoader />
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  return (
    <div>
      <PageHeader title="Limit policies" description="Trading volume and feature limits per plan and verification level." />
      <Notice tone="info" className="mb-5">Volume limits are measured in each policy&apos;s currency; other currencies are converted at reference rates when checked. Enforced on the server.</Notice>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(q.data ?? []).map((p) => (
          <div key={p.key} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
            <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">{p.name}</h3><Button size="sm" variant="outline" onClick={() => edit(p)}>Edit</Button></div>
            <p className="mb-2 font-mono text-xs text-[var(--color-text-muted)]">{p.key}</p>
            <ul className="space-y-0.5">{AMOUNTS.map(([k, l]) => <li key={k} className="flex justify-between"><span>{l}</span><span>{minorToDecimal(p[k], minorUnit(p.limitCurrency))} {p.limitCurrency}</span></li>)}
              {COUNTS.map(([k, l]) => <li key={k} className="flex justify-between"><span>{l}</span><span>{p[k]}</span></li>)}</ul>
          </div>
        ))}
      </div>
      {key && (
        <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:grid-cols-3">
          <h2 className="text-lg sm:col-span-3">Editing {key}</h2>
          <Field label="Name"><TextInput value={String(d.name)} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
          <Field label="Limit currency"><CurrencySelect value={String(d.limitCurrency)} onChange={(v) => setD({ ...d, limitCurrency: v })} /></Field>
          <span />
          {AMOUNTS.map(([k, l]) => <Field key={k} label={l}><TextInput inputMode="decimal" value={String(d[k])} onChange={(e) => setD({ ...d, [k]: e.target.value })} /></Field>)}
          {COUNTS.map(([k, l]) => <Field key={k} label={l}><TextInput inputMode="numeric" value={String(d[k])} onChange={(e) => setD({ ...d, [k]: e.target.value })} /></Field>)}
          <div className="grid gap-2 sm:col-span-3 sm:grid-cols-3">{FLAGS.map(([k, l]) => <Checkbox key={k} checked={!!d[k]} onChange={(v) => setD({ ...d, [k]: v })}>{l}</Checkbox>)}</div>
          <Field label="Reason (audit log)" className="sm:col-span-3"><TextInput value={String(d.reason)} onChange={(e) => setD({ ...d, reason: e.target.value })} /></Field>
          {err && <p role="alert" className="text-sm text-red-600 sm:col-span-3">{err}</p>}
          <div className="flex gap-2 sm:col-span-3"><Button type="submit" disabled={save.isPending}>Save policy</Button><Button type="button" variant="ghost" onClick={() => setKey(null)}>Cancel</Button></div>
        </form>
      )}
    </div>
  )
}
