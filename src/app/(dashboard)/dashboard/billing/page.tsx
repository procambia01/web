'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import type { BoostDto, FeaturedDto, PaymentDto, SubscriptionDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { withReauth } from '@/store/reauth.store'
import { useCurrencies } from '@/hooks/useCurrencies'
import { enumLabel, formatDate, formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ErrorState, Notice, PageLoader } from '@/components/ui/states'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

const PAY_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  SUCCEEDED: 'success', PROCESSING: 'info', REQUIRES_PAYMENT: 'warning', FAILED: 'error', CANCELLED: 'neutral', EXPIRED: 'neutral', PARTIALLY_REFUNDED: 'info', REFUNDED: 'info',
}

/** Shows the SERVER's view of a payment after returning from Stripe. The redirect itself proves nothing. */
function ReturnBanner({ paymentId }: { paymentId: string }) {
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => api.get<PaymentDto>(`/billing/payments/${paymentId}`),
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === 'REQUIRES_PAYMENT' || s === 'PROCESSING' || !s ? 3000 : false
    },
    refetchIntervalInBackground: false,
  })
  const s = q.data?.status
  if (q.error) return <Notice tone="warning" className="mb-6">We couldn&apos;t check that payment yet. It will appear below once confirmed.</Notice>
  if (!s || s === 'REQUIRES_PAYMENT' || s === 'PROCESSING') return <Notice tone="info" className="mb-6">Waiting for Stripe to confirm your payment… this usually takes a few seconds. You can leave this page; we&apos;ll notify you.</Notice>
  if (s === 'SUCCEEDED') { void qc.invalidateQueries({ queryKey: ['subscriptions'] }); return <Notice tone="success" className="mb-6">Payment confirmed. Your purchase is now active.</Notice> }
  if (s === 'FAILED') return <Notice tone="error" className="mb-6">The payment failed{q.data?.failureReason ? `: ${q.data.failureReason}` : ''}. You have not been charged for an active service.</Notice>
  return <Notice tone="warning" className="mb-6">This checkout was {enumLabel(s).toLowerCase()}. Nothing was purchased.</Notice>
}

function BillingInner() {
  const sp = useSearchParams()
  const paymentId = sp.get('payment')
  const qc = useQueryClient()
  const { money } = useCurrencies()
  const [page, setPage] = useState(1)
  const [cancelFor, setCancelFor] = useState<SubscriptionDto | null>(null)

  const subs = useQuery({ queryKey: ['subscriptions'], queryFn: () => api.get<SubscriptionDto[]>('/billing/subscriptions') })
  const pays = useQuery({ queryKey: ['payments', page], queryFn: () => api.page<PaymentDto>('/billing/payments', { page, perPage: 10 }) })
  const promos = useQuery({ queryKey: ['promotions'], queryFn: () => api.get<{ boosts: BoostDto[]; featured: FeaturedDto[] }>('/billing/promotions') })

  const portal = useMutation({
    mutationFn: () => withReauth(() => api.post<{ url: string }>('/billing/portal')),
    onSuccess: (r) => window.location.assign(r.url),
    onError: (e) => toast.error(errorMessage(e)),
  })
  const toggle = useMutation({
    mutationFn: (v: { id: string; cancelAtPeriodEnd: boolean }) => api.post(`/billing/subscriptions/${v.id}/cancel-at-period-end`, { cancelAtPeriodEnd: v.cancelAtPeriodEnd }),
    onSuccess: () => { toast.success('Subscription updated'); void qc.invalidateQueries({ queryKey: ['subscriptions'] }) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const payCols: Column<PaymentDto>[] = [
    { key: 'date', header: 'Date', render: (p) => formatDateTime(p.paidAt ?? p.createdAt) },
    { key: 'item', header: 'Service', render: (p) => <span>{enumLabel(p.kind)}<span className="block text-xs text-[var(--color-text-muted)]">{p.productCode}</span></span> },
    { key: 'amount', header: 'Amount', render: (p) => <span>{money(p.amount, p.currency)}{p.refundedAmount !== '0' && Number(p.refundedAmount) > 0 && <span className="block text-xs text-[var(--color-text-muted)]">refunded {money(p.refundedAmount, p.currency)}</span>}</span> },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge label={enumLabel(p.status)} variant={PAY_VARIANT[p.status] ?? 'neutral'} /> },
  ]

  return (
    <div>
      <PageHeader title="Billing" description="Payments to CashMouver for plans and promotions. Exchanged cash never passes through us." />
      {paymentId && <ReturnBanner paymentId={paymentId} />}
      {sp.get('status') === 'cancelled' && !paymentId && <Notice tone="info" className="mb-6">Checkout was cancelled. You were not charged.</Notice>}

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg">Subscriptions</h2>
          <Button variant="outline" size="sm" disabled={portal.isPending} onClick={() => portal.mutate()}><CreditCard size={14} className="mr-1.5" />{portal.isPending ? 'Opening…' : 'Payment method & invoices'}<ExternalLink size={12} className="ml-1.5" /></Button>
        </div>
        {subs.isLoading ? <PageLoader /> : subs.error ? <ErrorState error={subs.error} onRetry={() => subs.refetch()} /> : !subs.data?.length ? (
          <p className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-secondary)]">No subscription. <Link className="font-semibold underline" href="/dashboard/premium">See plans</Link></p>
        ) : (
          <ul className="space-y-3">
            {subs.data.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div>
                  <p className="font-semibold">{enumLabel(s.tier)} · {money(s.amount, s.currency)} / {s.interval === 'YEAR' ? 'year' : 'month'}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    <StatusBadge label={enumLabel(s.status)} variant={s.status === 'ACTIVE' || s.status === 'TRIALING' ? 'success' : s.status === 'PAST_DUE' ? 'warning' : 'neutral'} />{' '}
                    {s.currentPeriodEnd && (s.cancelAtPeriodEnd ? `Ends ${formatDate(s.currentPeriodEnd)}` : `Renews ${formatDate(s.currentPeriodEnd)}`)}
                  </p>
                  {s.status === 'PAST_DUE' && <p className="mt-1 text-sm text-amber-600">Your last payment failed. Update your payment method to keep your plan.</p>}
                </div>
                {['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(s.status) && (
                  s.cancelAtPeriodEnd
                    ? <Button size="sm" variant="outline" disabled={toggle.isPending} onClick={() => toggle.mutate({ id: s.id, cancelAtPeriodEnd: false })}>Resume</Button>
                    : <Button size="sm" variant="outline" onClick={() => setCancelFor(s)}>Cancel at period end</Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg">Payment history</h2>
        <DataTable columns={payCols} data={pays.data?.items ?? []} keyFn={(p) => p.id} isLoading={pays.isLoading} emptyTitle="No payments yet"
          page={pays.data?.meta.page} totalPages={pays.data?.meta.totalPages} total={pays.data?.meta.total} perPage={10} onPageChange={setPage} />
      </section>

      <section>
        <h2 className="mb-3 text-lg">Boosts & featured placements</h2>
        {promos.error ? <ErrorState error={promos.error} onRetry={() => promos.refetch()} /> : (
          <DataTable
            columns={[
              { key: 'type', header: 'Type', render: (r: (BoostDto | FeaturedDto) & { _t: string }) => r._t },
              { key: 'offer', header: 'Offer', render: (r) => <Link className="underline" href={`/dashboard/offers/${r.offerId}`}>View offer</Link> },
              { key: 'period', header: 'Period', render: (r) => `${formatDate(r.startsAt)} – ${formatDate(r.endsAt)}` },
              { key: 'perf', header: 'Views / clicks', render: (r) => `${r.impressions} / ${r.clicks}` },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge label={enumLabel(r.status)} variant={r.status === 'ACTIVE' ? 'success' : 'neutral'} /> },
            ]}
            data={[...(promos.data?.boosts ?? []).map((b) => ({ ...b, _t: 'Boost' })), ...(promos.data?.featured ?? []).map((f) => ({ ...f, _t: 'Featured' }))]}
            keyFn={(r) => `${r._t}${r.id}`} isLoading={promos.isLoading} emptyTitle="Nothing boosted yet" emptyDesc="Boost or feature an offer from its page."
          />
        )}
      </section>

      <ConfirmDialog open={!!cancelFor} onOpenChange={(o) => !o && setCancelFor(null)} title="Cancel subscription?"
        description={`You keep your plan until ${formatDate(cancelFor?.currentPeriodEnd)}. It won't renew after that.`} confirmLabel="Cancel at period end" destructive
        onConfirm={async () => { if (cancelFor) await toggle.mutateAsync({ id: cancelFor.id, cancelAtPeriodEnd: true }) }} />
    </div>
  )
}

export default function BillingPage() {
  return <Suspense fallback={<PageLoader />}><BillingInner /></Suspense>
}
