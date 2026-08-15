'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, CreditCard, Upload, Camera, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { userService, verificationService } from '@/services'
import { PageHeader } from '@/components/ui/page-header'
import { useAuthStore } from '@/store/auth.store'

const DOC_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'national_id', label: 'National ID' },
]

export default function VerificationPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useAuthStore()

  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
  })
  const profile = data?.data ?? user

  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const [docType, setDocType] = useState('national_id')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const feePaid = Boolean(profile?.verificationFeePaid)

  const handlePayFee = async () => {
    setIsStartingCheckout(true)
    try {
      const res = await verificationService.createCheckout()
      if (res.data.url) window.location.href = res.data.url
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not start checkout')
    } finally {
      setIsStartingCheckout(false)
    }
  }

  const handleSubmit = async () => {
    if (!docFile || !selfieFile || !profile) return
    setIsSubmitting(true)
    try {
      const docForm = new FormData()
      docForm.append('documentType', docType)
      docForm.append('documentNumber', '')
      docForm.append('country', profile.country ?? '')
      docForm.append('idDocument', docFile)
      await verificationService.submitDocument(profile.id, docForm)

      const selfieForm = new FormData()
      selfieForm.append('selfie', selfieFile)
      await verificationService.submitSelfie(profile.id, selfieForm)

      qc.invalidateQueries({ queryKey: ['profile'] })
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto space-y-5">
      <PageHeader title="Identity Verification" description="Build trust, unlock higher swap limits" />

      {!feePaid ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-sm)] text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center mx-auto mb-4">
            <Shield size={30} className="text-[var(--color-primary)]" />
          </div>
          <h2 className="font-display font-bold text-xl text-[var(--color-text-primary)]">Get Verified</h2>
          <p className="text-sm text-[var(--color-text-secondary)] font-body mt-2 leading-relaxed">
            A one-time $2.99 fee covers document review and unlocks the Verified Trader badge —
            higher trust, higher swap limits, and access to verified-only offers.
          </p>
          <button
            onClick={handlePayFee}
            disabled={isStartingCheckout}
            className="mt-6 inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[var(--color-primary)] text-white font-semibold font-body text-sm hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--shadow-primary)] disabled:opacity-60"
          >
            <CreditCard size={16} />
            {isStartingCheckout ? 'Loading…' : 'Pay & Continue'}
          </button>
        </div>
      ) : submitted ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-sm)] text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={30} className="text-emerald-500" />
          </div>
          <h2 className="font-display font-bold text-xl text-[var(--color-text-primary)]">Documents Submitted!</h2>
          <p className="text-sm text-[var(--color-text-secondary)] font-body mt-2">
            We&apos;re reviewing your identity documents. This usually takes 24–48 hours.
          </p>
          <button
            onClick={() => router.push('/dashboard/profile')}
            className="mt-6 h-10 px-5 rounded-xl border border-[var(--color-border)] text-sm font-semibold font-body text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors"
          >
            Back to Profile
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] space-y-5">
          <div>
            <label className="text-sm font-semibold font-body text-[var(--color-text-primary)] mb-2 block">
              Document Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DOC_TYPES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDocType(d.value)}
                  className={`h-10 rounded-xl border text-xs font-semibold font-body transition-colors ${
                    docType === d.value
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold font-body text-[var(--color-text-primary)] mb-2 block">
              Upload Document
            </label>
            <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-[var(--color-border)] cursor-pointer hover:border-[var(--color-primary)] transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              />
              <Upload size={22} className="text-[var(--color-text-muted)]" />
              <span className="text-xs text-[var(--color-text-secondary)] font-body mt-2">
                {docFile ? docFile.name : 'Click to upload'}
              </span>
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold font-body text-[var(--color-text-primary)] mb-2 block">
              Selfie
            </label>
            <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-[var(--color-border)] cursor-pointer hover:border-[var(--color-primary)] transition-colors">
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
              />
              <Camera size={22} className="text-[var(--color-text-muted)]" />
              <span className="text-xs text-[var(--color-text-secondary)] font-body mt-2">
                {selfieFile ? selfieFile.name : 'Click to upload'}
              </span>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!docFile || !selfieFile || isSubmitting}
            className="w-full h-11 rounded-xl bg-[var(--color-primary)] text-white font-semibold font-body text-sm hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--shadow-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting…' : 'Submit for Verification'}
          </button>
        </div>
      )}
    </motion.div>
  )
}
