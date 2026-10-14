'use client'
import { create } from 'zustand'
import type { AuthResult, LoginRequest, MeDto, RegisterRequest } from '@/contracts'
import { ApiError, api, authCall, refreshSession, tokenStore } from '@/lib/api'

type Status = 'loading' | 'authed' | 'anon'

interface AuthState {
  user: MeDto | null
  status: Status
  /** Restores the session from the httpOnly cookie (called once on app start). */
  init: () => Promise<void>
  login: (input: LoginRequest) => Promise<MeDto>
  register: (input: RegisterRequest) => Promise<MeDto>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (u: MeDto) => void
  clear: () => void
}

let initPromise: Promise<void> | null = null

function deviceInfo() {
  if (typeof navigator === 'undefined') return {}
  return { deviceName: `${navigator.platform || 'Web'} · ${navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser'}`.slice(0, 120) }
}

function acceptSession(r: AuthResult) {
  tokenStore.set(r.tokens.accessToken, r.tokens.accessTokenExpiresAt)
  return r.user
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'loading',

  init() {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          if (await refreshSession()) {
            const me = await api.get<MeDto>('/auth/me')
            set({ user: me, status: 'authed' })
            return
          }
        } catch (e) {
          if (!(e instanceof ApiError)) console.error('session restore failed')
        }
        tokenStore.clear()
        set({ user: null, status: 'anon' })
      })()
    }
    return initPromise
  },

  async login(input) {
    const r = await authCall<AuthResult>('login', { ...deviceInfo(), ...input })
    const user = acceptSession(r)
    set({ user, status: 'authed' })
    return user
  },

  async register(input) {
    const r = await authCall<AuthResult>('register', { ...deviceInfo(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, ...input })
    const user = acceptSession(r)
    set({ user, status: 'authed' })
    return user
  },

  async logout() {
    try {
      await authCall('logout')
    } catch {
      /* the server session may already be gone; local cleanup still happens */
    }
    get().clear()
  },

  async refreshUser() {
    const me = await api.get<MeDto>('/auth/me')
    set({ user: me })
  },

  setUser: (user) => set({ user }),

  clear() {
    tokenStore.clear()
    initPromise = null
    set({ user: null, status: 'anon' })
  },
}))
