'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar }  from '@/components/layout/Topbar'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '@/store/ui.store'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { mobileMenuOpen, setMobileMenu } = useUIStore()

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return }
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, user, router])

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return null

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      <aside className="hidden lg:flex flex-col shrink-0 border-r border-[var(--color-sidebar-border)] overflow-hidden">
        <Sidebar />
      </aside>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenu(false)} />
            <motion.aside key="drawer" initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 flex flex-col w-64 lg:hidden border-r border-[var(--color-sidebar-border)]">
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
