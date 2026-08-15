'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarCollapsed:  boolean
  mobileMenuOpen:    boolean
  toggleSidebar:     () => void
  setMobileMenu:     (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileMenuOpen:   false,
      toggleSidebar:    () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileMenu:    (open) => set({ mobileMenuOpen: open }),
    }),
    { name: 'cashmova-ui', partialize: s => ({ sidebarCollapsed: s.sidebarCollapsed }) }
  )
)
