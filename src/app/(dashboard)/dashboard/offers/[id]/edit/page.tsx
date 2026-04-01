'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { offerService } from '@/services'
import { createOfferSchema, type CreateOfferFormData } from '@/lib/validators'
import { CURRENCIES } from '@/lib/constants'
import { getCurrencyFlag } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="text-sm font-semibold text-[var(--color-text-secondary)] font-body block mb-1.5">
    {children}{required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
  </label>
)

const inputCls = (err?: string) => cn(
  'w-full h-10 px-3 rounded-xl border bg-[var(--color-surface)] font-body text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-all focus:ring-2',
  err
    ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]/20 focus:border-[var(--color-error)]'
    : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]',
)

export default function EditOfferPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const qc      = useQueryClient()
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['offer', id],
    queryFn:  () => offerService.getById(id),
  })

  const offer = data?.data

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isDirty } } = useForm<CreateOfferFormData>({
    resolver: zodResolver(createOfferSchema),
  })

  useEffect(() => {
    if (offer) reset({
      haveCurrency:   offer.haveCurrency,
      wantCurrency:   offer.wantCurrency,
      haveAmount:     offer.haveAmount,
      wantAmount:     offer.wantAmount,
      city:           offer.city,
      country:        offer.country,
      availableFrom:  offer.availableFrom.slice(0, 16),
      availableUntil: offer.availableUntil.slice(0, 16),
      notes:          offer.notes ?? '',
      isFlexible:     offer.isFlexible,
      visibility:     offer.visibility,
    })
  }, [offer, reset])

  const haveCurrency = watch('haveCurrency')
  const wantCurrency = watch('wantCurrency')
  const haveAmount   = watch('haveAmount')
  const wantAmount   = watch('wantAmount')
  const rate = haveAmount > 0 && wantAmount > 0 ? (wantAmount / haveAmount).toFixed(4) : null

  const onSubmit = async (data: CreateOfferFormData) => {
    setSaving(true)
    try {
      await offerService.update(id, data)
      qc.invalidateQueries({ queryKey: ['offer', id] })
      toast.success('Offer updated!')
      router.push(`/dashboard/offers/${id}`)
    } catch { toast.error('Failed to update offer') }
    finally { setSaving(false) }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] p-6">
      <h3 className="font-display font-bold text-[var(--color-text-primary)] mb-5">{title}</h3>
      {children}
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        title="Edit Offer"
        description={`${offer?.haveCurrency} → ${offer?.wantCurrency}`}
        actions={
          <Link href={`/dashboard/offers/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-body transition-colors">
            <ArrowLeft size={15} /> Back
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <SectionCard title="Exchange Details">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label required>I have</Label>
              <Controller control={control} name="haveCurrency"
                render={({ field }) => (
                  <select value={field.value} onChange={e => field.onChange(e.target.value)}
                    className={cn(inputCls(errors.haveCurrency?.message), 'appearance-none cursor-pointer')}>
                    <option value="">Select currency</option>
                    {CURRENCIES.filter(c => c.code !== wantCurrency).map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
                    ))}
                  </select>
                )} />
            </div>
            <div>
              <Label required>I want</Label>
              <Controller control={control} name="wantCurrency"
                render={({ field }) => (
                  <select value={field.value} onChange={e => field.onChange(e.target.value)}
                    className={cn(inputCls(errors.wantCurrency?.message), 'appearance-none cursor-pointer')}>
                    <option value="">Select currency</option>
                    {CURRENCIES.filter(c => c.code !== haveCurrency).map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
                    ))}
                  </select>
                )} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 mt-4">
            <div>
              <Label required>Amount offering</Label>
              <input {...register('haveAmount')} type="number" step="0.01" min="0"
                className={inputCls(errors.haveAmount?.message)} />
            </div>
            <div>
              <Label required>Amount wanting</Label>
              <input {...register('wantAmount')} type="number" step="0.01" min="0"
                className={inputCls(errors.wantAmount?.message)} />
            </div>
          </div>

          {rate && haveCurrency && wantCurrency && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-accent-light)] text-sm font-semibold font-body text-[var(--color-accent-dark)]">
              📊 Rate: 1 {haveCurrency} = {rate} {wantCurrency}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Location">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label required>City</Label>
              <input {...register('city')} placeholder="e.g. Lagos" className={inputCls(errors.city?.message)} />
            </div>
            <div>
              <Label required>Country</Label>
              <input {...register('country')} placeholder="e.g. Nigeria" className={inputCls(errors.country?.message)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Availability & Options">
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <Label required>Available from</Label>
              <input {...register('availableFrom')} type="datetime-local" className={inputCls()} />
            </div>
            <div>
              <Label required>Available until</Label>
              <input {...register('availableUntil')} type="datetime-local" className={inputCls()} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <Label>Visibility</Label>
              <select {...register('visibility')} className={cn(inputCls(), 'appearance-none cursor-pointer')}>
                <option value="PUBLIC">Public</option>
                <option value="VERIFIED_ONLY">Verified Only</option>
                <option value="PREMIUM_ONLY">Premium Only</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer mb-5">
            <input {...register('isFlexible')} type="checkbox"
              className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body">Flexible timing</p>
              <p className="text-xs text-[var(--color-text-muted)] font-body">Allow negotiation on meeting time</p>
            </div>
          </label>

          <div>
            <Label>Notes (optional)</Label>
            <textarea {...register('notes')} rows={3}
              className={cn(inputCls(), 'h-auto resize-none py-2.5')} />
          </div>
        </SectionCard>

        <div className="flex justify-end gap-3 pb-4">
          <Link href={`/dashboard/offers/${id}`}
            className="h-10 px-5 rounded-xl border border-[var(--color-border)] text-sm font-semibold font-body text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors flex items-center">
            Cancel
          </Link>
          <button type="submit" disabled={saving || !isDirty}
            className="h-10 px-6 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold font-body hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--shadow-primary)] flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
