'use client'
import { Bell, Menu, Search, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/format'

// Build a readable page title from the pathname
function usePageTitle(): string {
  const p = usePathname()
  if (p === '/dashboard')               return 'Dashboard'
  if (p.startsWith('/dashboard/offers'))return 'My Offers'
  if (p.startsWith('/dashboard/swaps')) return 'My Swaps'
  if (p.startsWith('/dashboard/messages')) return 'Messages'
  if (p.startsWith('/dashboard/notifications')) return 'Notifications'
  if (p.startsWith('/dashboard/transactions')) return 'Transactions'
  if (p.startsWith('/dashboard/referrals')) return 'Referrals'
  if (p.startsWith('/dashboard/profile')) return 'Profile'
  if (p.startsWith('/admin/users'))      return 'User Management'
  if (p.startsWith('/admin/swaps'))      return 'Swap Management'
  if (p.startsWith('/admin/disputes'))   return 'Disputes'
  if (p.startsWith('/admin/verifications')) return 'Verifications'
  if (p.startsWith('/admin/analytics'))  return 'Analytics'
  if (p.startsWith('/admin'))            return 'Admin Overview'
  return 'Cashmova'
}

export function Topbar() {
  const { setTheme, resolvedTheme } = useTheme()
  const { setMobileMenu }           = useUIStore()
  const { user }                    = useAuthStore()
  const title                       = usePageTitle()

  return (
    <header className={cn(
      'sticky top-0 z-30 h-16 flex items-center gap-4 px-4 sm:px-6',
      'bg-[var(--color-surface)]/80 backdrop-blur border-b border-[var(--color-border)]',
    )}>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenu(true)}
        className="lg:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <Menu size={22} />
      </button>

      {/* Page title */}
      <h1 className="font-display font-bold text-[var(--color-text-primary)] text-lg">
        {title}
      </h1>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] w-48 cursor-pointer hover:border-[var(--color-primary)]/50 transition-colors">
        <Search size={14} />
        <span className="text-xs font-body">Search…</span>
        <span className="ml-auto text-[10px] bg-[var(--color-border)] rounded px-1.5 py-0.5">⌘K</span>
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="w-9 h-9 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors"
      >
        {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Notifications */}
      <Link
        href="/dashboard/notifications"
        className="relative w-9 h-9 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors"
      >
        <Bell size={16} />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-error)] text-white text-[9px] font-bold flex items-center justify-center pulse-dot">
          3
        </span>
      </Link>

      {/* Avatar */}
      <Link href="/dashboard/profile" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-xs font-bold shadow-[var(--shadow-primary)]">
          {user ? initials(user.name) : 'U'}
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-semibold text-[var(--color-text-primary)] font-body leading-none">{user?.name}</p>
          <p className="text-[10px] text-[var(--color-text-muted)] font-body mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
        </div>
      </Link>
    </header>
  )
}
