'use client'
import { Bell, Menu, Sun, Moon, MessageSquare } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { useUnread } from '@/hooks/useUnread'
import { initials } from '@/lib/format'
import { APP_NAME } from '@/lib/constants'

const TITLES: [string, string][] = [
  ['/dashboard/market', 'Find offers'], ['/dashboard/offers', 'My offers'], ['/dashboard/swaps', 'My swaps'], ['/dashboard/messages', 'Messages'],
  ['/dashboard/notifications', 'Notifications'], ['/dashboard/rate-alerts', 'Rate alerts'], ['/dashboard/insights', 'Market insights'],
  ['/dashboard/disputes', 'Disputes'], ['/dashboard/referrals', 'Referrals'], ['/dashboard/verification', 'Verification'], ['/dashboard/premium', 'Plans & boosts'],
  ['/dashboard/billing', 'Billing'], ['/dashboard/business', 'Business'], ['/dashboard/advertising', 'Advertising'], ['/dashboard/developer', 'Developer API'],
  ['/dashboard/settings', 'Settings'], ['/dashboard/profile', 'Profile'], ['/dashboard', 'Overview'],
  ['/admin/users', 'Users'], ['/admin/verification', 'Verification queue'], ['/admin/disputes', 'Disputes'], ['/admin/risk', 'Risk flags'], ['/admin/ads', 'Ad review'],
  ['/admin/audit-logs', 'Audit logs'], ['/admin/currencies', 'Currencies'], ['/admin/products', 'Products & plans'], ['/admin/limits', 'Limit policies'],
  ['/admin/referral-rules', 'Referral rules'], ['/admin/templates', 'Notification templates'], ['/admin/config', 'Platform settings'], ['/admin/payments', 'Service payments'],
  ['/admin/ledger', 'Revenue ledger'], ['/admin/webhooks', 'Stripe events'], ['/admin/api-keys', 'API keys'], ['/admin', 'Admin overview'],
]

function usePageTitle() {
  const p = usePathname()
  return TITLES.find(([prefix]) => p.startsWith(prefix))?.[1] ?? APP_NAME
}

const iconBtn = 'relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)]'

export function Topbar() {
  const { setTheme, resolvedTheme } = useTheme()
  const setMobileMenu = useUIStore((s) => s.setMobileMenu)
  const user = useAuthStore((s) => s.user)
  const title = usePageTitle()
  const unread = useUnread()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 backdrop-blur sm:px-6">
      <button onClick={() => setMobileMenu(true)} aria-label="Open menu" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] lg:hidden"><Menu size={22} /></button>
      <h1 className="font-display text-lg font-bold text-[var(--color-text-primary)]">{title}</h1>
      <div className="flex-1" />
      <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" className={iconBtn}>
        {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <Link href="/dashboard/messages" aria-label={`Messages, ${unread.messages} unread`} className={iconBtn}>
        <MessageSquare size={16} />
        {unread.messages > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-error)] px-1 text-[9px] font-bold text-white">{unread.messages > 99 ? '99+' : unread.messages}</span>}
      </Link>
      <Link href="/dashboard/notifications" aria-label={`Notifications, ${unread.notifications} unread`} className={iconBtn}>
        <Bell size={16} />
        {unread.notifications > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-error)] px-1 text-[9px] font-bold text-white">{unread.notifications > 99 ? '99+' : unread.notifications}</span>}
      </Link>
      <Link href="/dashboard/profile" className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-xs font-bold text-white">{user ? initials(user.name) : 'U'}</span>
        <span className="hidden sm:block">
          <span className="block text-xs font-semibold leading-none text-[var(--color-text-primary)]">{user?.name}</span>
          <span className="mt-0.5 block text-[10px] capitalize text-[var(--color-text-muted)]">{user?.planTier.toLowerCase()} plan</span>
        </span>
      </Link>
    </header>
  )
}
