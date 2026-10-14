'use client'
import { create } from 'zustand'
import { ApiError } from '@/lib/api'

interface ReauthState {
  open: boolean
  needsTwoFactor: boolean
  resolver: ((ok: boolean) => void) | null
  ask: (needsTwoFactor?: boolean) => Promise<boolean>
  settle: (ok: boolean) => void
}

export const useReauthStore = create<ReauthState>((set, get) => ({
  open: false,
  needsTwoFactor: false,
  resolver: null,
  ask(needsTwoFactor = false) {
    return new Promise<boolean>((resolve) => {
      get().resolver?.(false)
      set({ open: true, needsTwoFactor, resolver: resolve })
    })
  },
  settle(ok) {
    get().resolver?.(ok)
    set({ open: false, resolver: null })
  },
}))

/**
 * Runs a sensitive action. If the server answers REAUTH_REQUIRED the user is
 * asked for their password (and 2FA code), then the action is retried once.
 */
export async function withReauth<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action()
  } catch (e) {
    if (e instanceof ApiError && e.code === 'REAUTH_REQUIRED') {
      const ok = await useReauthStore.getState().ask()
      if (ok) return action()
    }
    throw e
  }
}
