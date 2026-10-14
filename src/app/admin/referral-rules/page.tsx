'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, errorMessage } from '@/lib/api'
import { decimalToMinor, minorToDecimal } from '@/lib/minor'
import { useCurrencies } from '@/hooks/useCurrencies'
import { enumLabel } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, NativeSelect, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ErrorState, Notice } from '@/components/ui/states'
import { CurrencySelect } from '@/components/shared/CurrencySelect'

interface Rule { id: string; code: string; name: string; qualifyingAction: string; minCompletedSwaps: number; rewardType: string; rewardMinor: number; percentBps: number; currency: string; isPartnerRule: boolean; monthlyCapPerReferrer: number; lifetimeCapPerReferrer: number; holdDays: number; isActive: boolean }
const blank = { code: '', name: '', qualifyingAction: 'FIRST_COMPLETED_SWAP', minCompletedSwaps: '1', rewardType: 'FIXED', reward: '0', percent: '0', currency: 'EUR', isPartnerRule: false, monthlyCap: '20', lifetimeCap: '500', holdDays: '7', isActive: true }

export default function AdminReferralRules() {
  const qc = useQueryClient()
  const { money, minorUnit } = useCurrencies()
  const q = useQuery({ queryKey: ['admin', 'referral-rules'], queryFn: () => api.get<Rule[]>('/admin/referral-rules') })
  const [f, setF] = useState<typeof blank | null>(null)
  const [edit, setEdit] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const save = useMutation({ mutationFn: (b: unknown) => api.put('/admin/referral-rules', b), onSuccess: () => { toast.success('Saved'); setF(null); void qc.invalidateQueries({ queryKey: ['admin', 'referral-rules'] }) }, onError: (e) => setErr(errorMessage(e)) })
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setF((x) => (x ? { ...x, [k]: v } : x))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!f) return
    const minor = decimalToMinor(f.reward, minorUnit(f.currency))
    if (minor === null) return setErr('Reward: too many decimals for this currency')
    const bps = Math.round(Number(f.percent) * 100)
    if (!Number.isFinite(bps) || bps < 0 || bps > 10000) return setErr('Percent must be between 0 and 100')
    setErr(null)
    save.mutate({ code: f.code, name: f.name, qualifyingAction: f.qualifyingAction, minCompletedSwaps: Number(f.minCompletedSwaps), rewardType: f.rewardType, rewardMinor: Number(minor), percentBps: bps, currency: f.currency, isPartnerRule: f.isPartnerRule, monthlyCapPerReferrer: Number(f.monthlyCap), lifetimeCapPerReferrer: Number(f.lifetimeCap), holdDays: Number(f.holdDays), isActive: f.isActive })
  }
  const cols: Column<Rule>[] = [
    { key: 'n', header: 'Rule', render: (r) => <span><strong>{r.name}</strong><span className="block font-mono text-xs text-[var(--color-text-muted)]">{r.code}</span></span> },
    { key: 'a', header: 'Qualifies when', render: (r) => `${enumLabel(r.qualifyingAction)}${r.minCompletedSwaps ? ` (≥${r.minCompletedSwaps} swaps)` : ''}` },
    { key: 'r', header: 'Reward', render: (r) => r.rewardType === 'FIXED' ? money(minorToDecimal(r.rewardMinor, minorUnit(r.currency)), r.currency) : `${(r.percentBps / 100).toFixed(2)}% of service revenue` },
    { key: 'c', header: 'Caps / hold', render: (r) => <span className="text-xs">{r.monthlyCapPerReferrer}/mo · {r.lifetimeCapPerReferrer} lifetime · {r.holdDays}d hold</span> },
    { key: 's', header: 'Status', render: (r) => <StatusBadge label={r.isActive ? 'Active' : 'Off'} variant={r.isActive ? 'success' : 'neutral'} /> },
    { key: 'x', header: '', render: (r) => <Button size="sm" variant="outline" onClick={() => { setErr(null); setEdit(true); setF({ code: r.code, name: r.name, qualifyingAction: r.qualifyingAction, minCompletedSwaps: String(r.minCompletedSwaps), rewardType: r.rewardType, reward: minorToDecimal(r.rewardMinor, minorUnit(r.currency)), percent: (r.percentBps / 100).toString(), currency: r.currency, isPartnerRule: r.isPartnerRule, monthlyCap: String(r.monthlyCapPerReferrer), lifetimeCap: String(r.lifetimeCapPerReferrer), holdDays: String(r.holdDays), isActive: r.isActive }) }}>Edit</Button> },
  ]
  return (
    <div>
      <PageHeader title="Referral rules" description="Rewards are CashMouver marketing payouts and need meaningful activity — never just a sign-up." actions={<Button onClick={() => { setErr(null); setEdit(false); setF(blank) }}>New rule</Button>} />
      <Notice tone="info" className="mb-5">Rewards are held for the hold period so fraud review can catch abuse.</Notice>
      {f && (
        <form onSubmit={submit} className="mb-6 grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:grid-cols-3">
          <Field label="Code"><TextInput value={f.code} disabled={edit} onChange={(e) => set('code', e.target.value.toUpperCase())} /></Field>
          <Field label="Name"><TextInput value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Qualifying action"><NativeSelect value={f.qualifyingAction} onChange={(e) => set('qualifyingAction', e.target.value)}>{['FIRST_COMPLETED_SWAP', 'VERIFIED_AND_SWAP', 'PAID_PLAN_PURCHASE'].map((x) => <option key={x} value={x}>{enumLabel(x)}</option>)}</NativeSelect></Field>
          <Field label="Min completed swaps"><TextInput inputMode="numeric" value={f.minCompletedSwaps} onChange={(e) => set('minCompletedSwaps', e.target.value)} /></Field>
          <Field label="Reward type"><NativeSelect value={f.rewardType} onChange={(e) => set('rewardType', e.target.value)}><option value="FIXED">Fixed amount</option><option value="PERCENT_OF_SERVICE_REVENUE">% of service revenue</option></NativeSelect></Field>
          <Field label="Currency"><CurrencySelect value={f.currency} onChange={(v) => set('currency', v)} /></Field>
          {f.rewardType === 'FIXED' ? <Field label="Reward amount"><TextInput inputMode="decimal" value={f.reward} onChange={(e) => set('reward', e.target.value)} /></Field> : <Field label="Percent"><TextInput inputMode="decimal" value={f.percent} onChange={(e) => set('percent', e.target.value)} /></Field>}
          <Field label="Monthly cap / referrer"><TextInput inputMode="numeric" value={f.monthlyCap} onChange={(e) => set('monthlyCap', e.target.value)} /></Field>
          <Field label="Lifetime cap / referrer"><TextInput inputMode="numeric" value={f.lifetimeCap} onChange={(e) => set('lifetimeCap', e.target.value)} /></Field>
          <Field label="Hold (days)"><TextInput inputMode="numeric" value={f.holdDays} onChange={(e) => set('holdDays', e.target.value)} /></Field>
          <Checkbox checked={f.isPartnerRule} onChange={(v) => set('isPartnerRule', v)}>Partner programme rule</Checkbox><Checkbox checked={f.isActive} onChange={(v) => set('isActive', v)}>Active</Checkbox>
          {err && <p role="alert" className="text-sm text-red-600 sm:col-span-3">{err}</p>}
          <div className="flex gap-2 sm:col-span-3"><Button type="submit" disabled={save.isPending}>Save</Button><Button type="button" variant="ghost" onClick={() => setF(null)}>Cancel</Button></div>
        </form>
      )}
      {q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : <DataTable columns={cols} data={q.data ?? []} keyFn={(r) => r.id} isLoading={q.isLoading} />}
    </div>
  )
}
