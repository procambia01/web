'use client'
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { CreateOfferRequest, OfferDto, UpdateOfferRequest } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { serverErrors } from '@/lib/form'
import { PageHeader } from '@/components/ui/page-header'
import { ErrorState, Notice, PageLoader } from '@/components/ui/states'
import { OfferForm } from '@/components/shared/OfferForm'

export default function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const q = useQuery({ queryKey: ['offer', id], queryFn: () => api.get<OfferDto>(`/offers/${id}`) })
  const m = useMutation({
    // The API updates offers with PATCH (partial update).
    mutationFn: (p: CreateOfferRequest | UpdateOfferRequest) => api.patch<OfferDto>(`/offers/${id}`, p),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['offer', id] }); void qc.invalidateQueries({ queryKey: ['offers'] }); toast.success('Offer updated'); router.push(`/dashboard/offers/${id}`) },
    onError: (e) => { setErrs(serverErrors(e)); setFormError(errorMessage(e)) },
  })
  if (q.isLoading) return <PageLoader />
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  if (!q.data.mine) return <ErrorState error={new Error('You can only edit your own offers.')} />
  return (
    <div className="max-w-3xl">
      <PageHeader title="Edit offer" description="Changes never affect swaps that were already agreed." />
      {formError && <Notice tone="error" className="mb-4">{formError}</Notice>}
      <OfferForm offer={q.data} busy={m.isPending} serverErrors={errs} onSubmit={(p) => { setFormError(''); m.mutate(p) }} />
    </div>
  )
}
