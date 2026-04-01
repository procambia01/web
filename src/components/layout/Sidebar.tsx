'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ArrowLeftRight, FileText, MessageSquare,
  Bell, User, Settings, LogOut, ChevronLeft, ChevronRight,
  ShieldCheck, Receipt, Gift, Users, BarChart3, AlertTriangle,
  X, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { initials } from '@/lib/format'

const USER_NAV = [
  { href: '/dashboard',               icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/dashboard/offers',        icon: FileText,        label: 'My Offers'    },
  { href: '/dashboard/swaps',         icon: ArrowLeftRight,  label: 'My Swaps'     },
  { href: '/dashboard/messages',      icon: MessageSquare,   label: 'Messages'     },
  { href: '/dashboard/notifications', icon: Bell,            label: 'Notifications'},
  { href: '/dashboard/transactions',  icon: Receipt,         label: 'Transactions' },
  { href: '/dashboard/referrals',     icon: Gift,            label: 'Referrals'    },
] as const

const ADMIN_NAV = [
  { href: '/admin',                   icon: BarChart3,       label: 'Overview'     },
  { href: '/admin/users',             icon: Users,           label: 'Users'        },
  { href: '/admin/swaps',             icon: ArrowLeftRight,  label: 'Swaps'        },
  { href: '/admin/disputes',          icon: AlertTriangle,   label: 'Disputes'     },
  { href: '/admin/verifications',     icon: ShieldCheck,     label: 'Verifications'},
  { href: '/admin/analytics',         icon: BarChart3,       label: 'Analytics'    },
] as const

interface SidebarProps { mobile?: boolean }

export function Sidebar({ mobile }: SidebarProps) {
  const pathname   = usePathname()
  const router     = useRouter()
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar, setMobileMenu } = useUIStore()

  const collapsed = !mobile && sidebarCollapsed
  const isAdmin   = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const nav       = isAdmin && pathname.startsWith('/admin') ? ADMIN_NAV : USER_NAV

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    router.push('/login')
  }

  const close = () => setMobileMenu(false)

  return (
    <div className={cn(
      'flex flex-col h-full transition-all duration-300 bg-[var(--color-sidebar-bg)]',
      collapsed ? 'w-[72px]' : 'w-64',
    )}>
      {/* Logo row */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-[var(--color-sidebar-border)] shrink-0',
        collapsed ? 'justify-center' : 'justify-between',
      )}>
        {!collapsed && (
          <Link href="/dashboard" onClick={close} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center shrink-0">
              <span className="font-display font-black text-white text-sm">S</span>
            </div>
            <span className="font-display font-bold text-white text-lg">SwapFX</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <span className="font-display font-black text-white text-sm">S</span>
          </div>
        )}
        {!mobile && (
          <button onClick={toggleSidebar}
            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
        {mobile && (
          <button onClick={close} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 font-body">
            {isAdmin && pathname.startsWith('/admin') ? 'Admin' : 'Main Menu'}
          </p>
        )}

        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} onClick={close}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium font-body transition-all group relative',
                active
                  ? 'bg-[var(--color-primary)]/15 text-white nav-active-glow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5',
                collapsed && 'justify-center px-0',
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className={cn('shrink-0', active ? 'text-[var(--color-primary)]' : '')} />
              {!collapsed && <span>{label}</span>}
              {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />}
            </Link>
          )
        })}

        {/* Premium upgrade CTA (user nav only, not admin) */}
        {!(isAdmin && pathname.startsWith('/admin')) && !user?.isPremium && (
          <div className="pt-3">
            <div className="h-px bg-[var(--color-sidebar-border)] mb-3" />
            <Link href="/dashboard/premium" onClick={close}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold font-body transition-all',
                'bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-accent)]/15',
                'text-[var(--color-accent)] hover:from-[var(--color-primary)]/30 hover:to-[var(--color-accent)]/25',
                pathname.startsWith('/dashboard/premium') && 'ring-1 ring-[var(--color-accent)]/40',
                collapsed && 'justify-center px-0',
              )}
              title={collapsed ? 'Upgrade to Premium' : undefined}
            >
              <Sparkles size={18} className="shrink-0" />
              {!collapsed && <span>Upgrade to Premium</span>}
            </Link>
          </div>
        )}

        {/* Admin toggle */}
        {isAdmin && !collapsed && (
          <div className="pt-3">
            <div className="h-px bg-[var(--color-sidebar-border)] mb-3" />
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 font-body">
              {pathname.startsWith('/admin') ? 'User Area' : 'Admin Area'}
            </p>
            <Link href={pathname.startsWith('/admin') ? '/dashboard' : '/admin'} onClick={close}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium font-body text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <ShieldCheck size={18} />
              <span>{pathname.startsWith('/admin') ? 'User Dashboard' : 'Admin Panel'}</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Profile + Logout */}
      <div className="shrink-0 border-t border-[var(--color-sidebar-border)] p-3 space-y-1">
        <Link href="/dashboard/profile" onClick={close}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium font-body text-slate-400 hover:text-white hover:bg-white/5 transition-all',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'Profile' : undefined}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user ? initials(user.name) : 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-slate-500 text-[10px] truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && <Settings size={14} className="shrink-0 text-slate-500" />}
        </Link>

        <button onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium font-body text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )
}
