'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Search, ArrowLeftRight, FileText, MessageSquare, Bell, Gift, Sparkles, ShieldCheck, CreditCard,
  LineChart, KeyRound, Megaphone, AlertTriangle, Users, BarChart3, ChevronLeft, ChevronRight, X, LogOut, Settings,
  Coins, Package, SlidersHorizontal, Webhook, BookOpen, Flag, ScrollText, Settings2, Gauge, BellRing, type LucideIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { useUnread } from '@/hooks/useUnread'
import { initials } from '@/lib/format'
import { Wordmark, LogoMark } from './Logo'

interface NavItem { href: string; icon: LucideIcon; label: string; badge?: 'messages' | 'notifications' }
interface NavGroup { title: string; items: NavItem[]; /** Only ADMIN / SUPER_ADMIN see this group (the API enforces the same). */ adminOnly?: boolean }

const USER_NAV: NavGroup[] = [
  {
    title: 'Marketplace',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
      { href: '/dashboard/market', icon: Search, label: 'Find offers' },
      { href: '/dashboard/offers', icon: FileText, label: 'My offers' },
      { href: '/dashboard/swaps', icon: ArrowLeftRight, label: 'My swaps' },
      { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages', badge: 'messages' },
      { href: '/dashboard/notifications', icon: Bell, label: 'Notifications', badge: 'notifications' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { href: '/dashboard/rate-alerts', icon: BellRing, label: 'Rate alerts' },
      { href: '/dashboard/insights', icon: LineChart, label: 'Market insights' },
      { href: '/dashboard/disputes', icon: AlertTriangle, label: 'Disputes' },
      { href: '/dashboard/referrals', icon: Gift, label: 'Referrals' },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/dashboard/verification', icon: ShieldCheck, label: 'Verification' },
      { href: '/dashboard/premium', icon: Sparkles, label: 'Plans & boosts' },
      { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
      { href: '/dashboard/business', icon: Gauge, label: 'Business' },
      { href: '/dashboard/advertising', icon: Megaphone, label: 'Advertising' },
      { href: '/dashboard/developer', icon: KeyRound, label: 'Developer API' },
      { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

const ADMIN_NAV: NavGroup[] = [
  {
    title: 'Operations',
    items: [
      { href: '/admin', icon: BarChart3, label: 'Overview' },
      { href: '/admin/users', icon: Users, label: 'Users' },
      { href: '/admin/verification', icon: ShieldCheck, label: 'Verification' },
      { href: '/admin/disputes', icon: AlertTriangle, label: 'Disputes' },
      { href: '/admin/risk', icon: Flag, label: 'Risk flags' },
      { href: '/admin/ads', icon: Megaphone, label: 'Ad review' },
      { href: '/admin/audit-logs', icon: ScrollText, label: 'Audit logs' },
    ],
  },
  {
    title: 'Configuration',
    adminOnly: true,
    items: [
      { href: '/admin/currencies', icon: Coins, label: 'Currencies' },
      { href: '/admin/products', icon: Package, label: 'Products & plans' },
      { href: '/admin/limits', icon: SlidersHorizontal, label: 'Limit policies' },
      { href: '/admin/referral-rules', icon: Gift, label: 'Referral rules' },
      { href: '/admin/templates', icon: BookOpen, label: 'Notification templates' },
      { href: '/admin/config', icon: Settings2, label: 'Platform settings' },
    ],
  },
  {
    title: 'Revenue',
    adminOnly: true,
    items: [
      { href: '/admin/payments', icon: CreditCard, label: 'Service payments' },
      { href: '/admin/ledger', icon: ScrollText, label: 'Revenue ledger' },
      { href: '/admin/webhooks', icon: Webhook, label: 'Stripe events' },
      { href: '/admin/api-keys', icon: KeyRound, label: 'API keys' },
    ],
  },
]

export function Sidebar({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar, setMobileMenu } = useUIStore()
  const unread = useUnread()

  const inAdmin = pathname.startsWith('/admin')
  const collapsed = !mobile && sidebarCollapsed
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const groups = inAdmin ? ADMIN_NAV.filter((g) => !g.adminOnly || isAdmin) : USER_NAV
  const close = () => setMobileMenu(false)

  async function signOut() {
    await logout()
    toast.success('Signed out')
    router.push('/login')
  }

  return (
    <div className={cn('flex h-full flex-col bg-[var(--color-sidebar-bg)] transition-all duration-300', collapsed ? 'w-[72px]' : 'w-64')}>
      <div className={cn('flex h-16 shrink-0 items-center border-b border-[var(--color-sidebar-border)] px-4', collapsed ? 'justify-center' : 'justify-between')}>
        <Link href={inAdmin ? '/admin' : '/dashboard'} onClick={close} aria-label="CashMouver home">
          {collapsed ? <LogoMark /> : <Wordmark light />}
        </Link>
        {!mobile && !collapsed && (
          <button onClick={toggleSidebar} aria-label="Collapse sidebar" className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/5 hover:text-white"><ChevronLeft size={14} /></button>
        )}
        {mobile && <button onClick={close} aria-label="Close menu" className="text-slate-400 hover:text-white"><X size={20} /></button>}
      </div>
      {collapsed && (
        <button onClick={toggleSidebar} aria-label="Expand sidebar" className="mx-auto mt-2 flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/5 hover:text-white"><ChevronRight size={14} /></button>
      )}

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4" aria-label="Main">
        {groups.map((g) => (
          <div key={g.title} className="space-y-0.5">
            {!collapsed && <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{g.title}</p>}
            {g.items.map(({ href, icon: Icon, label, badge }) => {
              const exact = href === '/dashboard' || href === '/admin'
              const active = exact ? pathname === href : pathname.startsWith(href)
              const count = badge ? unread[badge] : 0
              return (
                <Link key={href} href={href} onClick={close} title={collapsed ? label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn('group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    active ? 'nav-active-glow bg-[var(--color-primary)]/15 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    collapsed && 'justify-center px-0')}>
                  <Icon size={18} className={cn('shrink-0', active && 'text-[var(--color-primary)]')} />
                  {!collapsed && <span className="flex-1">{label}</span>}
                  {count > 0 && (
                    <span className={cn('rounded-full bg-[var(--color-error)] px-1.5 text-[10px] font-bold leading-4 text-white', collapsed && 'absolute right-1 top-0.5')} aria-label={`${count} unread`}>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}

        {isStaff && (
          <div className="border-t border-[var(--color-sidebar-border)] pt-3">
            <Link href={inAdmin ? '/dashboard' : '/admin'} onClick={close} title={collapsed ? 'Switch area' : undefined}
              className={cn('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white', collapsed && 'justify-center px-0')}>
              <ShieldCheck size={18} />
              {!collapsed && <span>{inAdmin ? 'Back to app' : 'Admin panel'}</span>}
            </Link>
          </div>
        )}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-[var(--color-sidebar-border)] p-3">
        <Link href="/dashboard/profile" onClick={close} className={cn('flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 transition-all hover:bg-white/5 hover:text-white', collapsed && 'justify-center px-0')}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-xs font-bold text-white">{user ? initials(user.name) : 'U'}</span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-white">{user?.name}</span>
              <span className="block truncate text-[10px] text-slate-500">{user?.email}</span>
            </span>
          )}
        </Link>
        <button onClick={signOut} title={collapsed ? 'Sign out' : undefined}
          className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400', collapsed && 'justify-center px-0')}>
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  )
}
