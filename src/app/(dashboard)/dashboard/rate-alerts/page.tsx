'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { rateAlertSchema, type RateAlertDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { useEntitlements } from '@/hooks/usePlan'
import { formatRate, timeAgo } from '@/lib/format'
import { toDecimalString, validate, serverErrors, type FieldErrors } from '@/lib/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, NativeSelect, Switch, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState, ErrorState, Notice, Skeleton } from '@/components/ui/states'
import { CurrencySelect } from '@/components/shared/CurrencySelect'

export default function RateAlertsPage() {
  const qc = useQueryClient()
  const ent = useEntitlements()
  const list = useQuery({ queryKey: ['rate-alerts'], queryFn: () => api.get<RateAlertDto[]>('/rate-alerts') })
  const [f, setF] = useState({ baseCurrency: '', quoteCurrency: '', targetRate: '', direction: 'ABOVE' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const invalidate = () => { void qc.invalidateQueries({ queryKey: ['rate-alerts'] }); void qc.invalidateQueries({ queryKey: ['entitlements'] }) }

  const create = useMutation({
    mutationFn: (b: unknown) => api.post('/rate-alerts', b),
    onSuccess: () => { toast.success('Alert created'); setF((p) => ({ ...p, targetRate: '' })); invalidate() },
    onError: (e) => { setErrors(serverErrors(e)); setFormError(errorMessage(e)) },
  })
  const toggle = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/rate-alerts/${id}`, { isActive }), onSuccess: invalidate, onError: (e) => toast.error(errorMessage(e)) })
  const remove = useMutation({ mutationFn: (id: string) => api.del(`/rate-alerts/${id}`), onSuccess: invalidate, onError: (e) => toast.error(errorMessage(e)) })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const { data, errors: errs } = validate(rateAlertSchema, { ...f, targetRate: toDecimalString(f.targetRate) ?? f.targetRate })
    setErrors(errs)
    if (data) create.mutate(data)
  }
  const atLimit = ent.data && ent.data.usage.rateAlerts >= ent.data.limits.maxRateAlerts

  return (
    <div className="max-w-3xl">
      <PageHeader title="Rate alerts" description="Get notified when a currency pair reaches the rate you want. Example: tell me when EUR/USD goes above 1.12." />
      {ent.data && <p className="mb-4 text-xs text-[var(--color-text-muted)]">{ent.data.usage.rateAlerts} of {ent.data.limits.maxRateAlerts} alerts used on your {ent.data.planTier.toLowerCase()} plan.</p>}
      {atLimit && <Notice tone="warning" className="mb-4">You&apos;ve used all your alerts. <Link href="/dashboard/premium" className="font-semibold underline">Upgrade for more</Link>.</Notice>}
      <Card className="mb-8">
        <CardHeader><CardTitle>New alert</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="When 1 unit of" error={errors.baseCurrency}><CurrencySelect value={f.baseCurrency} onChange={(v) => setF((p) => ({ ...p, baseCurrency: v }))} exclude={f.quoteCurrency} invalid={!!errors.baseCurrency} /></Field>
            <Field label="is worth, in" error={errors.quoteCurrency}><CurrencySelect value={f.quoteCurrency} onChange={(v) => setF((p) => ({ ...p, quoteCurrency: v }))} exclude={f.baseCurrency} invalid={!!errors.quoteCurrency} /></Field>
            <Field label="Direction"><NativeSelect value={f.direction} onChange={(e) => setF((p) => ({ ...p, direction: e.target.value }))}><option value="ABOVE">Goes above</option><option value="BELOW">Falls below</option></NativeSelect></Field>
            <Field label="Target rate" error={errors.targetRate}><TextInput inputMode="decimal" value={f.targetRate} onChange={(e) => setF((p) => ({ ...p, targetRate: e.target.value }))} invalid={!!errors.targetRate} placeholder="1.12" /></Field>
            {formError && <div className="sm:col-span-2"><Notice tone="error">{formError}</Notice></div>}
            <div className="sm:col-span-2"><Button type="submit" disabled={create.isPending || !!atLimit}>{create.isPending ? 'Saving…' : 'Create alert'}</Button></div>
          </form>
        </CardContent>
      </Card>

      {list.isLoading ? <Skeleton className="h-24" /> : list.error ? <ErrorState error={list.error} onRetry={() => list.refetch()} /> : list.data!.length === 0 ? (
        <EmptyState icon={<BellRing size={28} />} title="No alerts yet" description="Create one above and we'll notify you when the market hits your target." />
      ) : (
        <ul className="space-y-2">
          {list.data!.map((a) => (
            <li key={a.id} className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.baseCurrency}/{a.quoteCurrency} {a.direction === 'ABOVE' ? '≥' : '≤'} {formatRate(a.targetRate)}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{a.triggerCount > 0 ? `Triggered ${a.triggerCount}× · last ${timeAgo(a.lastTriggeredAt)}` : 'Not triggered yet'}</p>
              </div>
              <Switch checked={a.isActive} onChange={(v) => toggle.mutate({ id: a.id, isActive: v })} label={`Alert ${a.baseCurrency}/${a.quoteCurrency} active`} />
              <Button variant="ghost" size="icon-sm" aria-label="Delete alert" onClick={() => remove.mutate(a.id)}><Trash2 size={14} /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
