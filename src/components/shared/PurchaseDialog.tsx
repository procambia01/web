'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { ServiceProductDto } from '@/contracts'
import { useProducts } from '@/hooks/usePlan'
import { useCurrencies } from '@/hooks/useCurrencies'
import { startCheckout } from '@/lib/checkout'
import { errorMessage } from '@/lib/api'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Notice, Spinner } from '@/components/ui/states'
import { cn } from '@/lib/utils'

/** Pick a Boost or Featured product for one offer, then continue to Stripe Checkout. */
export function PromoteOfferDialog({ offerId, kind, open, onOpenChange }: { offerId: string; kind: 'BOOST' | 'FEATURED'; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, isLoading } = useProducts(kind)
  const { money } = useCurrencies()
  const [code, setCode] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const products: ServiceProductDto[] = data ?? []
  const chosen = code || products[0]?.code

  async function pay() {
    if (!chosen) return
    setBusy(true)
    try {
      await startCheckout(kind === 'BOOST' ? 'boost' : 'featured', { productCode: chosen, offerId })
    } catch (e) {
      toast.error(errorMessage(e))
      setBusy(false)
    }
  }

  const label = (p: ServiceProductDto) => (p.durationHours ? (p.durationHours >= 24 ? `${Math.round(p.durationHours / 24)} day${p.durationHours >= 48 ? 's' : ''}` : `${p.durationHours} hours`) : '')

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{kind === 'BOOST' ? 'Boost this offer' : 'Feature this offer'}</DialogTitle>
          <DialogDescription>
            {kind === 'BOOST' ? 'Boosting lifts your offer in search results. Relevance still matters — a poor match will not outrank a good one.' : 'Featured offers appear in premium placements across CashMouver, clearly labelled.'}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? <Spinner /> : products.length === 0 ? <Notice tone="info">This option isn&apos;t available right now.</Notice> : (
          <div className="grid gap-2" role="radiogroup">
            {products.map((p) => (
              <button key={p.code} type="button" role="radio" aria-checked={chosen === p.code} onClick={() => setCode(p.code)}
                className={cn('flex items-center justify-between rounded-xl border p-3 text-left', chosen === p.code ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-[var(--color-border)]')}>
                <span><span className="block font-semibold">{p.name}</span><span className="text-xs text-[var(--color-text-secondary)]">{label(p)}{p.placement ? ` · ${p.placement.replace(/_/g, ' ').toLowerCase()}` : ''}</span></span>
                <span className="font-display text-lg font-bold">{money(p.amount, p.currency)}</span>
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-[var(--color-text-muted)]">You&apos;ll pay CashMouver securely through Stripe. This is a service fee — it is unrelated to any currency you exchange.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={pay} disabled={busy || !chosen}>{busy ? 'Redirecting…' : 'Continue to payment'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
