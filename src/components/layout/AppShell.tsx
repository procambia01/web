'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { RealtimeBridge } from './RealtimeBridge'
import { PageLoader } from '@/components/ui/states'
import { Notice } from '@/components/ui/states'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

/** Signed-in shell used by both /dashboard and /admin. Role is only a UX gate — the API re-checks every request. */
export function AppShell({ children, staffOnly }: { children: React.ReactNode; staffOnly?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, status } = useAuthStore()
  const { mobileMenuOpen, setMobileMenu } = useUIStore()
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (status === 'anon') router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    else if (status === 'authed' && staffOnly && !isStaff) router.replace('/dashboard')
  }, [status, staffOnly, isStaff, router, pathname])

  useEffect(() => setMobileMenu(false), [pathname, setMobileMenu])

  if (status !== 'authed' || !user || (staffOnly && !isStaff)) return <PageLoader label="Loading your account…" />

  async function resend() {
    try {
      await api.post('/auth/resend-verification')
      toast.success('Verification email sent')
    } catch {
      toast.error('Could not send the email. Try again shortly.')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      <RealtimeBridge />
      <aside className="hidden shrink-0 flex-col overflow-hidden border-r border-[var(--color-sidebar-border)] lg:flex"><Sidebar /></aside>
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenu(false)} />
            <motion.aside key="drawer" initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--color-sidebar-border)] lg:hidden">
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!user.emailVerified && (
            <Notice tone="warning" className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span>Please verify your email address to create offers, start swaps and buy services.</span>
              <Button size="sm" variant="outline" onClick={resend}>Resend email</Button>
            </Notice>
          )}
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
