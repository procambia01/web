'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Camera, Shield, Star, TrendingUp, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEffect, useRef, useState } from 'react'
import { userService } from '@/services'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/components/ui/page-header'
import { UserAvatar } from '@/components/ui/user-avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/validators'
import {
  formatRating, formatNumber, formatPercent,
  trustScoreLabel, trustScoreColor,
} from '@/lib/format'
import { cn } from '@/lib/utils'

const inputCls = (err?: string) => cn(
  'w-full h-10 px-3 rounded-xl border bg-[var(--color-surface)] font-body text-sm',
  'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
  'outline-none transition-all focus:ring-2',
  err
    ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
    : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20',
)

const Card = ({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) => (
  <div className={cn('rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]', className)}>
    {title && <h3 className="font-display font-bold text-[var(--color-text-primary)] mb-5">{title}</h3>}
    {children}
  </div>
)

export default function ProfilePage() {
  const { user: authUser, setUser } = useAuthStore()
  const qc      = useQueryClient()
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn:  userService.getProfile,
  })

  const profile = data?.data

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  })

  useEffect(() => {
    if (profile) reset({
      name:    profile.name,
      phone:   profile.phone ?? '',
      bio:     profile.bio ?? '',
      country: profile.country ?? '',
      city:    profile.city ?? '',
    })
  }, [profile, reset])

  const onSubmit = async (data: UpdateProfileFormData) => {
    setSaving(true)
    try {
      const res = await userService.updateProfile(data)
      setUser({ ...authUser!, name: res.data.name, email: res.data.email })
      qc.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated')
    } catch { toast.error('Failed to update profile') }
    finally { setSaving(false) }
  }

  const verificationVariant =
    profile?.verificationStatus === 'VERIFIED'  ? 'success'  :
    profile?.verificationStatus === 'PENDING'   ? 'warning'  :
    profile?.verificationStatus === 'REJECTED'  ? 'error'    : 'neutral'

  const stats = [
    { label: 'Total Swaps',   value: formatNumber(profile?.totalSwaps ?? 0, 0),   icon: '🔄' },
    { label: 'Completed',     value: formatNumber(profile?.successfulSwaps ?? 0, 0), icon: '✅' },
    { label: 'Rating',        value: formatRating(profile?.rating ?? 0),           icon: '⭐' },
    { label: 'Confirmation',  value: formatPercent(profile?.confirmationRate ?? 0), icon: '📊' },
  ]

  if (isLoading) return (
    <div className="max-w-4xl mx-auto space-y-5">
      {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />)}
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-5">
      <PageHeader title="My Profile" description="Manage your account details and preferences" />

      {/* Hero */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <UserAvatar name={profile?.name ?? ''} image={profile?.image} size="2xl" />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-[var(--shadow-primary)] hover:bg-[var(--color-primary-dark)] transition-colors border-2 border-[var(--color-surface)]"
            >
              <Camera size={14} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h2 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">{profile?.name}</h2>
              {profile?.idVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded-full font-body font-semibold">
                  <Shield size={11} /> Verified
                </span>
              )}
              {profile?.isPremium && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-body font-semibold">
                  💎 {profile.premiumTier}
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-body mt-1">{profile?.email}</p>
            {profile?.bio && (
              <p className="text-sm text-[var(--color-text-secondary)] font-body mt-2 max-w-md leading-relaxed">{profile.bio}</p>
            )}
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
              <StatusBadge label={profile?.verificationStatus ?? 'UNVERIFIED'} variant={verificationVariant} dot />
              <StatusBadge label={profile?.role ?? 'USER'} variant="neutral" />
            </div>
          </div>

          {/* Trust score */}
          <div className="text-center shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] flex flex-col items-center justify-center mx-auto">
              <p className={cn('font-display font-black text-2xl', trustScoreColor(profile?.trustScore ?? 0))}>
                {profile?.trustScore ?? 0}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] font-body font-semibold">TRUST</p>
            </div>
            <p className={cn('text-xs font-semibold font-body mt-1.5', trustScoreColor(profile?.trustScore ?? 0))}>
              {trustScoreLabel(profile?.trustScore ?? 0)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-6 pt-5 border-t border-[var(--color-divider)]">
          {stats.map(({ label, value, icon }) => (
            <div key={label} className="text-center">
              <p className="text-lg mb-0.5">{icon}</p>
              <p className="font-display font-bold text-xl text-[var(--color-text-primary)]">{value}</p>
              <p className="text-xs text-[var(--color-text-muted)] font-body">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Edit form */}
        <Card title="Personal Info">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { key: 'name',    label: 'Full Name',    placeholder: 'Your name', type: 'text' },
              { key: 'phone',   label: 'Phone Number', placeholder: '+234 800 000 0000', type: 'tel' },
              { key: 'city',    label: 'City',         placeholder: 'Lagos, London…', type: 'text' },
              { key: 'country', label: 'Country',      placeholder: 'Nigeria, UK…', type: 'text' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] font-body block mb-1.5">{label}</label>
                <input
                  {...register(key as keyof UpdateProfileFormData)}
                  type={type}
                  placeholder={placeholder}
                  className={inputCls(errors[key as keyof typeof errors]?.message)}
                />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] font-body block mb-1.5">Bio</label>
              <textarea
                {...register('bio')}
                rows={3}
                placeholder="Tell traders about yourself…"
                className={cn(inputCls(errors.bio?.message), 'h-auto resize-none py-2.5')}
              />
            </div>
            <button type="submit" disabled={saving || !isDirty}
              className="w-full h-10 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold font-body hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--shadow-primary)] disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </Card>

        {/* Verification status */}
        <div className="space-y-5">
          <Card title="Verification">
            {profile?.verificationStatus === 'VERIFIED' ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-800 font-body">Identity Verified</p>
                  <p className="text-xs text-emerald-600 font-body mt-0.5">
                    Your identity has been confirmed. You have full access.
                  </p>
                </div>
              </div>
            ) : profile?.verificationStatus === 'PENDING' ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                <Shield className="w-8 h-8 text-amber-500 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800 font-body">Under Review</p>
                  <p className="text-xs text-amber-600 font-body mt-0.5">
                    Your documents are being reviewed. This usually takes 24–48hrs.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--color-text-secondary)] font-body leading-relaxed">
                  Verify your identity to build trust, unlock higher swap limits, and access premium features.
                </p>
                <a href="/dashboard/verification"
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold font-body hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--shadow-primary)]">
                  <Shield size={15} /> Start Verification
                </a>
              </div>
            )}
          </Card>

          <Card title="Ratings Summary">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <p className="font-display font-black text-4xl text-[var(--color-text-primary)]">
                  {formatRating(profile?.rating ?? 0)}
                </p>
                <div className="flex items-center gap-0.5 justify-center mt-1">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={cn('text-lg', s <= Math.round(profile?.rating ?? 0) ? 'text-amber-400' : 'text-[var(--color-border)]')}>★</span>
                  ))}
                </div>
                <p className="text-xs text-[var(--color-text-muted)] font-body mt-1">{profile?.totalSwaps ?? 0} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5,4,3,2,1].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-muted)] font-body w-2">{s}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: s === 5 ? '65%' : s === 4 ? '20%' : s === 3 ? '10%' : '5%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
