import Cookies from 'js-cookie'
import { apiGet, apiPost, type ApiResponse } from '@/lib/api'
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from '@/lib/constants'
import type { AuthUser, AuthTokens, User } from '@/types'

export interface LoginPayload    { email: string; password: string; rememberMe?: boolean }
export interface RegisterPayload { name: string; email: string; password: string; phone?: string; referralCode?: string }

const COOKIE_OPTS = { sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production' }

export const authService = {
  login: async (payload: LoginPayload) => {
    const res = await apiPost<{ user: AuthUser; tokens: AuthTokens }>('/auth/login', payload)
    const { user, tokens } = res.data
    Cookies.set(COOKIE_ACCESS_TOKEN,  tokens.accessToken,  { ...COOKIE_OPTS, expires: payload.rememberMe ? 30 : 7 })
    Cookies.set(COOKIE_REFRESH_TOKEN, tokens.refreshToken, { ...COOKIE_OPTS, expires: 30 })
    return user
  },

  register: async (payload: RegisterPayload) => {
    const res = await apiPost<{ user: AuthUser; tokens: AuthTokens }>('/auth/register', payload)
    const { user, tokens } = res.data
    Cookies.set(COOKIE_ACCESS_TOKEN,  tokens.accessToken,  { ...COOKIE_OPTS, expires: 7 })
    Cookies.set(COOKIE_REFRESH_TOKEN, tokens.refreshToken, { ...COOKIE_OPTS, expires: 30 })
    return user
  },

  logout: async () => {
    const token = Cookies.get(COOKIE_ACCESS_TOKEN)
    if (token) await apiPost('/auth/logout', { token }).catch(() => {})
    Cookies.remove(COOKIE_ACCESS_TOKEN)
    Cookies.remove(COOKIE_REFRESH_TOKEN)
  },

  me: () => apiGet<User>('/auth/me'),

  forgotPassword:  (email: string) => apiPost('/auth/forgot-password', { email }),
  resetPassword:   (token: string, newPassword: string) => apiPost('/auth/reset-password', { token, newPassword }),
  verifyEmail:     (token: string) => apiPost('/auth/verify-email', { token }),
  resendVerification: (email: string) => apiPost('/auth/resend-verification', { email }),
  changePassword:  (currentPassword: string, newPassword: string) => apiPost('/auth/change-password', { currentPassword, newPassword }),

  isAuthenticated: () => !!Cookies.get(COOKIE_ACCESS_TOKEN),
}
