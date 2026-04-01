'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Lock, Smartphone, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { userService } from '@/services'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/components/ui/page-header'
import { changePasswordSchema } from '@/lib/validators'
import type { z } from 'zod'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { z } from 'zod'

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

const inputCls = (err?: string) => cn(
  'w-full h-10 px-3 rounded-xl border bg-[var(--color-surface)] font-body text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-all focus:ring-2',
  err
    ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
    : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]',
)

const Card = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center">
        <Icon size={16} className="text-[var(--color-primary)]" />
      </div>
      <h3 className="font-display font-bold text-[var(--color-text-primary)]">{title}</h3>
    </div>
    {children}
  </div>
)

const ToggleRow = ({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between py-3 border-b border-[var(--color-divider)] last:border-0">
    <div>
      <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body">{label}</p>
      {sub && <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">{sub}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors shrink-0',
        checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
      )}
    >
      <span className={cn(
        'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-6' : 'translate-x-1',
      )} />
    </button>
  </div>
)

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const router   = useRouter()
  const qc       = useQueryClient()
  const { logout } = useAuthStore()

  const [notifSettings, setNotifSettings] = useState({
    receiveEmails: true,
    receiveSMS:    true,
    receivePush:   true,
  })
  const [pwLoading, setPwLoading] = useState(false)

  const { data } = useQuery({
    queryKey: ['profile-settings'],
    queryFn:  userService.getProfile,
  })

  useEffect(() => {
    if (data?.data) {
      setNotifSettings({
        receiveEmails: data.data.receiveEmails,
        receiveSMS:    data.data.receiveSMS,
        receivePush:   data.data.receivePush,
      })
    }
  }, [data])

  const handleNotifToggle = async (key: keyof typeof notifSettings, val: boolean) => {
    const prev = { ...notifSettings }
    setNotifSettings(s => ({ ...s, [key]: val }))
    try {
      await userService.updateSettings({ [key]: val })
    } catch {
      setNotifSettings(prev)
      toast.error('Failed to update setting')
    }
  }

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onChangePassword = async (data: ChangePasswordForm) => {
    setPwLoading(true)
    try {
      await authService.changePassword(data.currentPassword, data.newPassword)
      toast.success('Password updated')
      reset()
    } catch { toast.error('Current password is incorrect') }
    finally { setPwLoading(false) }
  }

  const handleDeleteAccount = async () => {
    const confirmed = prompt('Type DELETE to confirm account deletion:')
    if (confirmed !== 'DELETE') return
    toast.error('Account deletion — contact support at support@swapfx.app')
  }

  const THEMES = [
    { key: 'light',  label: 'Light',  icon: Sun     },
    { key: 'dark',   label: 'Dark',   icon: Moon    },
    { key: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-5">
      <PageHeader title="Settings" description="Manage your app preferences and security" />

      {/* Appearance */}
      <Card title="Appearance" icon={Monitor}>
        <p className="text-sm text-[var(--color-text-secondary)] font-body mb-3">Choose your preferred theme</p>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTheme(key)}
              className={cn(
                'flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all font-body',
                theme === key
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40',
              )}>
              <Icon size={20} />
              <span className="text-xs font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Notifications */}
      <Card title="Notifications" icon={Smartphone}>
        <ToggleRow
          label="Email Notifications"
          sub="Swap updates, offers and security alerts"
          checked={notifSettings.receiveEmails}
          onChange={v => handleNotifToggle('receiveEmails', v)}
        />
        <ToggleRow
          label="SMS Notifications"
          sub="OTP codes and urgent alerts"
          checked={notifSettings.receiveSMS}
          onChange={v => handleNotifToggle('receiveSMS', v)}
        />
        <ToggleRow
          label="Push Notifications"
          sub="Real-time swap and message alerts"
          checked={notifSettings.receivePush}
          onChange={v => handleNotifToggle('receivePush', v)}
        />
      </Card>

      {/* Security */}
      <Card title="Security" icon={Lock}>
        <p className="text-sm text-[var(--color-text-secondary)] font-body mb-4">Change your password</p>
        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] font-body block mb-1.5">Current Password</label>
            <input {...register('currentPassword')} type="password" placeholder="Current password"
              className={inputCls(errors.currentPassword?.message)} />
            {errors.currentPassword && <p className="text-xs text-[var(--color-error)] font-body mt-1">{errors.currentPassword.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] font-body block mb-1.5">New Password</label>
              <input {...register('newPassword')} type="password" placeholder="New password"
                className={inputCls(errors.newPassword?.message)} />
              {errors.newPassword && <p className="text-xs text-[var(--color-error)] font-body mt-1">{errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] font-body block mb-1.5">Confirm Password</label>
              <input {...register('confirmPassword')} type="password" placeholder="Confirm"
                className={inputCls(errors.confirmPassword?.message)} />
              {errors.confirmPassword && <p className="text-xs text-[var(--color-error)] font-body mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>
          <button type="submit" disabled={pwLoading}
            className="h-9 px-5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold font-body hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--shadow-primary)] disabled:opacity-50 flex items-center gap-2">
            {pwLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Update Password
          </button>
        </form>
      </Card>

      {/* Danger zone */}
      <Card title="Danger Zone" icon={AlertTriangle}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800 font-body">Delete Account</p>
          <p className="text-xs text-red-600 font-body mt-1 mb-3 leading-relaxed">
            Permanently delete your SwapFX account and all associated data. This action cannot be undone.
          </p>
          <button onClick={handleDeleteAccount}
            className="h-8 px-4 rounded-lg bg-red-600 text-white text-xs font-semibold font-body hover:bg-red-700 transition-colors">
            Delete My Account
          </button>
        </div>
      </Card>
    </motion.div>
  )
}
