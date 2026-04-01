'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

const PLAN_NAMES: Record<string, string> = {
  PREMIUM_MONTHLY:  'Premium Monthly',
  PREMIUM_YEARLY:   'Premium Annual',
  BUSINESS_MONTHLY: 'Business Monthly',
  BUSINESS_YEARLY:  'Business Annual',
}

export default function PremiumSuccessPage() {
  const params  = useSearchParams()
  const qc      = useQueryClient()
  const planId  = params.get('plan') ?? ''
  const [dots, setDots] = useState('.')

  useEffect(() => {
    // Invalidate subscription cache so dashboard reflects new plan
    qc.invalidateQueries({ queryKey: ['subscription'] })
    qc.invalidateQueries({ queryKey: ['profile'] })

    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(t)
  }, [qc])

  const features = [
    'Unlimited active offers unlocked',
    'Priority matching algorithm active',
    'Verified trader badge applied to your profile',
    'Advanced analytics dashboard available',
  ]

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full text-center"
      >
        {/* Animated check */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
          className="relative mx-auto w-24 h-24 mb-8"
        >
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
          <div className="relative w-full h-full rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="inline-flex items-center gap-2 bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 rounded-full px-4 py-1.5 mb-5">
            <Sparkles size={14} className="text-[var(--color-primary)]" />
            <span className="text-xs font-bold text-[var(--color-primary)] font-body">
              {PLAN_NAMES[planId] ?? 'Premium'} activated
            </span>
          </div>

          <h1 className="font-display font-black text-4xl text-[var(--color-text-primary)] mb-3 tracking-tight">
            Welcome to Premium! 🎉
          </h1>
          <p className="text-[var(--color-text-secondary)] font-body mb-8 leading-relaxed">
            Your subscription is now active. All premium features are unlocked and ready to use.
          </p>

          {/* Feature list */}
          <div className="bg-[var(--color-bg)] rounded-2xl border border-[var(--color-border)] p-5 mb-8 text-left">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest font-body mb-3">
              What's unlocked
            </p>
            <ul className="space-y-2.5">
              {features.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-body text-[var(--color-text-primary)]">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-2xl bg-[var(--color-primary)] text-white font-semibold text-sm font-body hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--shadow-primary)]">
              Go to Dashboard <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard/offers/create"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold text-sm font-body hover:bg-[var(--color-bg)] transition-colors">
              Create your first offer
            </Link>
          </div>

          <p className="text-xs text-[var(--color-text-muted)] font-body mt-6">
            A confirmation email has been sent to your inbox · Manage billing from your{' '}
            <Link href="/dashboard/premium" className="text-[var(--color-primary)] hover:underline">
              premium settings
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
