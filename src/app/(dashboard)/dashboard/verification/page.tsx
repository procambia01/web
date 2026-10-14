'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Clock, FileCheck2, ShieldAlert, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { verificationSubmitSchema, type ServiceProductDto, type VerificationCaseDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { startCheckout } from '@/lib/checkout'
import { countryOptions, countryName } from '@/lib/countries'
import { enumLabel, formatDate } from '@/lib/format'
import { validate, type FieldErrors } from '@/lib/form'
import { useAuthStore } from '@/store/auth.store'
import { useCurrencies } from '@/hooks/useCurrencies'
import { useProducts } from '@/hooks/usePlan'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, NativeSelect, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { ErrorState, Notice, Skeleton } from '@/components/ui/states'
import { StatusBadge } from '@/components/ui/status-badge'

const MAX_BYTES = 8 * 1024 * 1024
const VARIANT = { SUBMITTED: 'info', UNDER_REVIEW: 'info', VERIFIED: 'success', REJECTED: 'error', EXPIRED: 'neutral' } as const

function FileSlot({ label, hint, file, onFile, error }: { label: string; hint: string; file: File | null; onFile: (f: File | null) => void; error?: string }) {
  return (
    <Field label={label} hint={hint} error={error}>
      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => onFile(e.target.files?.[0] ?? null)} aria-label={label}
        className="block w-full rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary-light)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--color-primary)]" />
      {file && <p className="text-xs text-[var(--color-text-muted)]">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>}
    </Field>
  )
}

function SubmitForm({ enhanced }: { enhanced?: ServiceProductDto }) {
  const qc = useQueryClient()
  const countries = countryOptions()
  const [f, setF] = useState({ type: 'INDIVIDUAL', tier: 'BASIC', documentType: 'PASSPORT', documentCountry: '', businessName: '', registrationNumber: '' })
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const business = f.type === 'BUSINESS'
  const slots = business ? [['BUSINESS_REGISTRATION', 'Business registration document', 'Certificate of incorporation or equivalent'], ['PROOF_OF_ADDRESS', 'Proof of address (optional)', 'Utility bill or bank statement under 3 months old']] : [['ID_FRONT', 'ID document (front)', 'Passport photo page, or front of ID card / licence'], ['ID_BACK', 'ID document (back, if it has one)', 'Back of ID card or licence'], ['SELFIE', 'Selfie holding your document', 'Your face and the document must both be clearly visible']]
  const required = business ? ['BUSINESS_REGISTRATION'] : ['ID_FRONT', 'SELFIE']

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const { data, errors: errs } = validate(verificationSubmitSchema, { ...f, businessName: f.businessName || undefined, registrationNumber: f.registrationNumber || undefined })
    for (const k of required) if (!files[k]) errs[k] = 'This document is required'
    for (const [k, file] of Object.entries(files)) if (file && file.size > MAX_BYTES) errs[k] = 'File is larger than 8 MB'
    if (business && !f.businessName.trim()) errs.businessName = 'Enter the registered business name'
    setErrors(errs)
    if (!data || Object.keys(errs).length) return
    setBusy(true)
    try {
      const form = new FormData()
      for (const [k, v] of Object.entries(data)) if (v !== undefined) form.append(k, String(v))
      for (const [kind, file] of Object.entries(files)) if (file) { form.append('documents', file); form.append('kinds', kind) }
      const created = await api.upload<VerificationCaseDto>('/verification', form)
      toast.success('Submitted for review')
      setFiles({})
      void qc.invalidateQueries({ queryKey: ['verification'] })
      if (created.needsPayment && enhanced) await startCheckout('verification', { productCode: enhanced.code, caseId: created.id })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Verification for"><NativeSelect value={f.type} onChange={(e) => setF((p) => ({ ...p, type: e.target.value }))}><option value="INDIVIDUAL">Me (individual)</option><option value="BUSINESS">My business</option></NativeSelect></Field>
        <Field label="Level"><NativeSelect value={f.tier} onChange={(e) => setF((p) => ({ ...p, tier: e.target.value }))}><option value="BASIC">Standard (free)</option>{enhanced && <option value="ENHANCED">Enhanced — priority review (paid)</option>}</NativeSelect></Field>
        <Field label="Document type" error={errors.documentType}><NativeSelect value={f.documentType} onChange={(e) => setF((p) => ({ ...p, documentType: e.target.value }))}>{['PASSPORT', 'NATIONAL_ID', 'DRIVING_LICENCE', 'RESIDENCE_PERMIT'].map((d) => <option key={d} value={d}>{enumLabel(d)}</option>)}</NativeSelect></Field>
        <Field label="Issuing country" error={errors.documentCountry}><NativeSelect value={f.documentCountry} onChange={(e) => setF((p) => ({ ...p, documentCountry: e.target.value }))} invalid={!!errors.documentCountry}><option value="">Select…</option>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</NativeSelect></Field>
        {business && <><Field label="Registered business name" error={errors.businessName}><TextInput value={f.businessName} onChange={(e) => setF((p) => ({ ...p, businessName: e.target.value }))} /></Field><Field label="Registration number (optional)"><TextInput value={f.registrationNumber} onChange={(e) => setF((p) => ({ ...p, registrationNumber: e.target.value }))} /></Field></>}
      </div>
      {slots.map(([k, l, h]) => <FileSlot key={k} label={l} hint={h} file={files[k] ?? null} onFile={(file) => setFiles((p) => ({ ...p, [k]: file }))} error={errors[k]} />)}
      <Notice tone="info">Documents are encrypted in private storage, checked by authorised reviewers through short-lived links, and deleted on our retention schedule. We never show them to other members.</Notice>
      <Button type="submit" size="lg" className="h-10 px-6" disabled={busy}>{busy ? 'Uploading…' : f.tier === 'ENHANCED' ? 'Submit and continue to payment' : 'Submit for review'}</Button>
    </form>
  )
}

export default function VerificationPage() {
  const me = useAuthStore((s) => s.user)!
  const { money } = useCurrencies()
  const products = useProducts('VERIFICATION')
  const cases = useQuery({ queryKey: ['verification'], queryFn: () => api.get<VerificationCaseDto[]>('/verification') })
  const [payingId, setPayingId] = useState<string | null>(null)
  const enhanced = products.data?.[0]
  const open = cases.data?.find((c) => ['SUBMITTED', 'UNDER_REVIEW'].includes(c.status))

  async function pay(c: VerificationCaseDto) {
    if (!enhanced) return
    setPayingId(c.id)
    try { await startCheckout('verification', { productCode: enhanced.code, caseId: c.id }) } catch (e) { toast.error(errorMessage(e)); setPayingId(null) }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Verification" description="Verified members get higher limits and more trust. You can't verify yourself — a reviewer must approve your documents." />
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-4">
          {me.verificationStatus === 'VERIFIED' ? <BadgeCheck className="text-[var(--color-primary)]" size={36} /> : me.verificationStatus === 'PENDING' ? <Clock className="text-amber-500" size={36} /> : me.verificationStatus === 'REJECTED' ? <XCircle className="text-red-500" size={36} /> : <ShieldAlert className="text-[var(--color-text-muted)]" size={36} />}
          <div className="flex-1"><p className="font-display text-lg font-bold">{enumLabel(me.verificationStatus)}</p><p className="text-sm text-[var(--color-text-secondary)]">Level: {enumLabel(me.verificationTier)}{me.businessVerified ? ' · Business verified' : ''}</p></div>
        </CardContent>
      </Card>

      {cases.isLoading ? <Skeleton className="h-24" /> : cases.error ? <ErrorState error={cases.error} onRetry={() => cases.refetch()} /> : (cases.data?.length ?? 0) > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Your submissions</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-[var(--color-divider)]">
              {cases.data!.map((c) => (
                <li key={c.id} className="space-y-1 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2 font-semibold"><FileCheck2 size={14} /> {enumLabel(c.type)} · {enumLabel(c.tier)} · {enumLabel(c.documentType)} ({countryName(c.documentCountry)})</span><StatusBadge label={c.status.replace('_', ' ')} variant={VARIANT[c.status]} /></div>
                  <p className="text-xs text-[var(--color-text-muted)]">Submitted {formatDate(c.submittedAt)}{c.reviewedAt && ` · reviewed ${formatDate(c.reviewedAt)}`}{c.expiresAt && c.status === 'VERIFIED' && ` · valid until ${formatDate(c.expiresAt)}`}</p>
                  {c.rejectionReason && <Notice tone="error">Declined: {c.rejectionReason}</Notice>}
                  {c.needsPayment && enhanced && <div className="flex items-center gap-3 pt-1"><p className="text-xs text-[var(--color-text-secondary)]">Enhanced review starts once the {money(enhanced.amount, enhanced.currency)} fee is paid.</p><Button size="sm" disabled={payingId === c.id} onClick={() => pay(c)}>Pay fee</Button></div>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {open ? <Notice tone="info">Your submission is being reviewed. We&apos;ll notify you as soon as there&apos;s a decision.</Notice> : me.verificationStatus === 'VERIFIED' && me.verificationTier === 'ENHANCED' ? null : (
        <Card><CardHeader><CardTitle>{me.verificationStatus === 'VERIFIED' ? 'Upgrade or verify a business' : 'Verify your identity'}</CardTitle></CardHeader><CardContent><SubmitForm enhanced={enhanced} /></CardContent></Card>
      )}
    </div>
  )
}
