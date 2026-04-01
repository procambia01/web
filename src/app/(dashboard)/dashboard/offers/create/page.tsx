'use client'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowLeftRight, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
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

const CurrencySelect = ({ value, onChange, exclude, error }: { value: string; onChange: (v: string) => void; exclude?: string; error?: string }) => (
  <div>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(inputCls(error), 'appearance-none cursor-pointer')}
    >
      <option value="">Select currency…</option>
      {CURRENCIES.filter(c => c.code !== exclude).map(c => (
        <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
      ))}
    </select>
    {error && <p className="text-xs text-[var(--color-error)] font-body mt-1">{error}</p>}
  </div>
)

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] p-6">
    <h3 className="font-display font-bold text-[var(--color-text-primary)] mb-5">{title}</h3>
    {children}
  </div>
)

export default function CreateOfferPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateOfferFormData>({
    resolver: zodResolver(createOfferSchema),
    defaultValues: {
      isFlexible: true,
      visibility: 'PUBLIC',
      availableFrom:  new Date().toISOString().slice(0, 16),
      availableUntil: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    },
  })

  const haveCurrency = watch('haveCurrency')
  const wantCurrency = watch('wantCurrency')
  const haveAmount   = watch('haveAmount')
  const wantAmount   = watch('wantAmount')
  const rate = haveAmount > 0 && wantAmount > 0 ? (wantAmount / haveAmount).toFixed(4) : null

  const onSubmit = async (data: CreateOfferFormData) => {
    setLoading(true)
    try {
      await offerService.create({ ...data, latitude: 0, longitude: 0 })
      toast.success('Offer created successfully!')
      router.push('/dashboard/offers')
    } catch {
      toast.error('Failed to create offer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        title="Create Offer"
        description="Post a new currency exchange offer"
        actions={
          <Link href="/dashboard/offers"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-body transition-colors">
            <ArrowLeft size={15} /> Back
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Exchange */}
        <SectionCard title="Exchange Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
            <div>
              <Label required>I have</Label>
              <Controller control={control} name="haveCurrency"
                render={({ field }) => <CurrencySelect value={field.value} onChange={field.onChange} exclude={wantCurrency} error={errors.haveCurrency?.message} />} />
            </div>
            <div>
              <Label required>I want</Label>
              <Controller control={control} name="wantCurrency"
                render={({ field }) => <CurrencySelect value={field.value} onChange={field.onChange} exclude={haveCurrency} error={errors.wantCurrency?.message} />} />
            </div>
          </div>

          {/* Swap currencies button */}
          <div className="flex justify-center my-2">
            <button type="button"
              onClick={() => { const h = haveCurrency; const w = wantCurrency; setValue('haveCurrency', w); setValue('wantCurrency', h) }}
              className="flex items-center gap-2 text-xs text-[var(--color-primary)] font-semibold font-body hover:underline">
              <ArrowLeftRight size={14} /> Swap currencies
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label required>Amount offering {haveCurrency && `(${getCurrencyFlag(haveCurrency)} ${haveCurrency})`}</Label>
              <input {...register('haveAmount')} type="number" step="0.01" min="0" placeholder="0.00"
                className={inputCls(errors.haveAmount?.message)} />
              {errors.haveAmount && <p className="text-xs text-[var(--color-error)] font-body mt-1">{errors.haveAmount.message}</p>}
            </div>
            <div>
              <Label required>Amount wanting {wantCurrency && `(${getCurrencyFlag(wantCurrency)} ${wantCurrency})`}</Label>
              <input {...register('wantAmount')} type="number" step="0.01" min="0" placeholder="0.00"
                className={inputCls(errors.wantAmount?.message)} />
              {errors.wantAmount && <p className="text-xs text-[var(--color-error)] font-body mt-1">{errors.wantAmount.message}</p>}
            </div>
          </div>

          {rate && haveCurrency && wantCurrency && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-accent-light)] text-sm font-semibold font-body text-[var(--color-accent-dark)]">
              <span>📊</span>
              Rate: 1 {haveCurrency} = {rate} {wantCurrency}
            </div>
          )}
        </SectionCard>

        {/* Location */}
        <SectionCard title="Location">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label required>City</Label>
              <input {...register('city')} placeholder="e.g. Lagos, London" className={inputCls(errors.city?.message)} />
              {errors.city && <p className="text-xs text-[var(--color-error)] font-body mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <Label required>Country</Label>
              <input {...register('country')} placeholder="e.g. Nigeria, UK" className={inputCls(errors.country?.message)} />
              {errors.country && <p className="text-xs text-[var(--color-error)] font-body mt-1">{errors.country.message}</p>}
            </div>
          </div>
        </SectionCard>

        {/* Availability */}
        <SectionCard title="Availability">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label required>Available from</Label>
              <input {...register('availableFrom')} type="datetime-local" className={inputCls(errors.availableFrom?.message)} />
            </div>
            <div>
              <Label required>Available until</Label>
              <input {...register('availableUntil')} type="datetime-local" className={inputCls(errors.availableUntil?.message)} />
            </div>
          </div>
        </SectionCard>

        {/* Options */}
        <SectionCard title="Options">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <Label>Visibility</Label>
              <select {...register('visibility')} className={cn(inputCls(), 'appearance-none cursor-pointer')}>
                <option value="PUBLIC">Public — anyone can see</option>
                <option value="VERIFIED_ONLY">Verified users only</option>
                <option value="PREMIUM_ONLY">Premium users only</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input {...register('isFlexible')} type="checkbox"
              className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body">Flexible timing</p>
              <p className="text-xs text-[var(--color-text-muted)] font-body">Allow negotiation on meeting time</p>
            </div>
          </label>

          <div className="mt-5">
            <Label>Notes (optional)</Label>
            <textarea {...register('notes')} rows={3} placeholder="Any special instructions or requirements…"
              className={cn(inputCls(), 'h-auto resize-none py-2.5')} />
          </div>
        </SectionCard>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-4">
          <Link href="/dashboard/offers"
            className="h-10 px-5 rounded-xl border border-[var(--color-border)] text-sm font-semibold font-body text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors flex items-center">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="h-10 px-6 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold font-body hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--shadow-primary)] flex items-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {loading ? 'Creating…' : 'Create Offer'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
