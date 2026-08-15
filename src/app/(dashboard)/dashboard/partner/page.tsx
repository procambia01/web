'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Key, Copy, Trash2, Plus, Building2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { userService, partnerService } from '@/services'
import { PageHeader } from '@/components/ui/page-header'
import { useAuthStore } from '@/store/auth.store'

export default function PartnerDashboardPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
  })
  const profile = profileData?.data ?? user
  const isPartner = Boolean(profile?.isBusinessPartner)

  const { data: plansData } = useQuery({
    queryKey: ['partner-plans'],
    queryFn: () => partnerService.getPlans(),
    enabled: !isPartner,
  })
  const plans = plansData?.data ?? []

  const { data: keysData } = useQuery({
    queryKey: ['partner-keys'],
    queryFn: () => partnerService.listApiKeys(),
    enabled: isPartner,
  })
  const keys = keysData?.data ?? []

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState('')
  const [isCreatingKey, setIsCreatingKey] = useState(false)
  const [freshKey, setFreshKey] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    setCheckoutLoading(planId)
    try {
      const res = await partnerService.createCheckout(planId)
      if (res.data.url) window.location.href = res.data.url
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not start checkout')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim() || isCreatingKey) return
    setIsCreatingKey(true)
    try {
      const res = await partnerService.createApiKey(newKeyName.trim())
      setFreshKey(res.data.rawKey)
      setNewKeyName('')
      qc.invalidateQueries({ queryKey: ['partner-keys'] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not create key')
    } finally {
      setIsCreatingKey(false)
    }
  }

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Revoke this API key? Any integration using it will stop working immediately.')) return
    try {
      await partnerService.revokeApiKey(keyId)
      toast.success('Key revoked')
      qc.invalidateQueries({ queryKey: ['partner-keys'] })
    } catch {
      toast.error('Could not revoke key')
    }
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('Copied to clipboard')
  }

  if (!isPartner) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-5">
        <PageHeader
          title="Partner API Access"
          description="Real peer-agreed exchange rates and market data for forex bureaus and remittance agents"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]"
            >
              <Building2 size={22} className="text-[var(--color-primary)] mb-3" />
              <h3 className="font-display font-bold text-lg text-[var(--color-text-primary)]">{plan.name}</h3>
              <p className="text-2xl font-display font-bold text-[var(--color-text-primary)] mt-2">
                ${(plan.amountCents / 100).toFixed(0)}
                <span className="text-sm font-body font-normal text-[var(--color-text-muted)]">/mo</span>
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] font-body mt-1">
                {plan.rateLimitPerMinute} requests/min
              </p>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={checkoutLoading === plan.id}
                className="w-full mt-4 h-10 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold font-body hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-60"
              >
                {checkoutLoading === plan.id ? 'Loading…' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-5">
      <PageHeader title="Partner Dashboard" description="Manage your API keys and usage" />

      {freshKey && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800 font-body">
                Save this key now — it won&apos;t be shown again
              </p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 text-xs bg-white rounded-lg px-3 py-2 border border-emerald-200 font-mono overflow-x-auto">
                  {freshKey}
                </code>
                <button
                  onClick={() => copyKey(freshKey)}
                  className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors shrink-0"
                >
                  <Copy size={14} className="text-emerald-700" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <h3 className="font-display font-bold text-sm text-[var(--color-text-primary)] mb-3">Create a new key</h3>
        <div className="flex gap-2">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="e.g. Production server"
            className="flex-1 h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <button
            onClick={handleCreateKey}
            disabled={!newKeyName.trim() || isCreatingKey}
            className="h-10 px-4 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold font-body hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            <Plus size={15} /> Create
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] divide-y divide-[var(--color-divider)]">
        {keys.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-text-muted)] font-body">
            No API keys yet — create one above.
          </div>
        ) : (
          keys.map((key) => (
            <div key={key.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-bg)] flex items-center justify-center shrink-0">
                  <Key size={15} className="text-[var(--color-text-secondary)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold font-body text-[var(--color-text-primary)]">{key.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">
                    {key.keyPrefix}••••••••{' '}
                    {key.isActive ? (
                      <span className="text-emerald-600">Active</span>
                    ) : (
                      <span className="text-red-500">Revoked</span>
                    )}
                    {' · '}
                    {key.requestCount} requests
                  </p>
                </div>
              </div>
              {key.isActive && (
                <button
                  onClick={() => handleRevoke(key.id)}
                  className="w-8 h-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}
