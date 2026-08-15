'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types'
import { authService } from '@/services/auth.service'
import type { LoginPayload, RegisterPayload } from '@/services/auth.service'

interface AuthState {
  user:            AuthUser | null
  isAuthenticated: boolean
  isLoading:       boolean
  error:           string | null
}

interface AuthActions {
  login:    (p: LoginPayload)    => Promise<void>
  register: (p: RegisterPayload) => Promise<void>
  logout:   ()                   => Promise<void>
  setUser:  (u: AuthUser | null) => void
  clearError: ()                 => void
  init:     ()                   => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user:            null,
      isAuthenticated: false,
      isLoading:       false,
      error:           null,

      init: async () => {
        if (!authService.isAuthenticated()) {
          set({ user: null, isAuthenticated: false })
          return
        }
        try {
          const res = await authService.me()
          set({ user: res.data as unknown as AuthUser, isAuthenticated: true })
        } catch {
          set({ user: null, isAuthenticated: false })
        }
      },

      login: async (payload) => {
        set({ isLoading: true, error: null })
        try {
          const user = await authService.login(payload)
          set({ user, isAuthenticated: true, isLoading: false })
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Login failed'
          set({ isLoading: false, error: msg })
          throw err
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null })
        try {
          const user = await authService.register(payload)
          set({ user, isAuthenticated: true, isLoading: false })
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Registration failed'
          set({ isLoading: false, error: msg })
          throw err
        }
      },

      logout: async () => {
        await authService.logout()
        set({ user: null, isAuthenticated: false, error: null })
      },

      setUser:    (u) => set({ user: u, isAuthenticated: !!u }),
      clearError: ()  => set({ error: null }),
    }),
    {
      name: 'cashmova-auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
)
