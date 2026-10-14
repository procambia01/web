'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { CreateOfferRequest, OfferDto, UpdateOfferRequest } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { serverErrors } from '@/lib/form'
import { PageHeader } from '@/components/ui/page-header'
import { Notice } from '@/components/ui/states'
import { OfferForm } from '@/components/shared/OfferForm'
import { useEntitlements } from '@/hooks/usePlan'
import Link from 'next/link'

export default function CreateOfferPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const ent = useEntitlements()
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const m = useMutation({
    mutationFn: (p: CreateOfferRequest | UpdateOfferRequest) => api.post<OfferDto>('/offers', p),
    onSuccess: (o) => { void qc.invalidateQueries({ queryKey: ['offers'] }); void qc.invalidateQueries({ queryKey: ['entitlements'] }); toast.success('Offer published'); router.push(`/dashboard/offers/${o.id}`) },
    onError: (e) => { setErrs(serverErrors(e)); setFormError(errorMessage(e)) },
  })
  const atLimit = ent.data && ent.data.usage.activeOffers >= ent.data.limits.maxActiveOffers
  return (
    <div className="max-w-3xl">
      <PageHeader title="Create an offer" description="Tell people what you can exchange. No fee for swapping with other members." />
      {ent.data && <p className="mb-4 text-xs text-[var(--color-text-muted)]">{ent.data.usage.activeOffers} of {ent.data.limits.maxActiveOffers} active offers used on your {ent.data.planTier.toLowerCase()} plan.</p>}
      {atLimit && <Notice tone="warning" className="mb-4">You&apos;ve reached your active-offer limit. <Link href="/dashboard/premium" className="font-semibold underline">Upgrade your plan</Link> or pause an existing offer.</Notice>}
      {formError && <Notice tone="error" className="mb-4">{formError}</Notice>}
      <OfferForm busy={m.isPending} serverErrors={errs} onSubmit={(p) => { setFormError(''); m.mutate(p) }} />
    </div>
  )
}
