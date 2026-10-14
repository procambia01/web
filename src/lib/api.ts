import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import type { ApiFailure, ApiSuccess, PageMeta } from '@/contracts'
import { API_URL } from './constants'

/** Error thrown for every failed call — carries the server's stable error code. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
  /** Field-level validation messages, when the server sent them. */
  get fieldErrors(): Record<string, string> {
    const d = this.details as { issues?: { path: (string | number)[]; message: string }[]; fields?: Record<string, string[]> } | undefined
    const out: Record<string, string> = {}
    if (d?.issues) for (const i of d.issues) out[i.path.join('.')] = i.message
    if (d?.fields) for (const [k, v] of Object.entries(d.fields)) out[k] = v[0]
    return out
  }
}

export function errorMessage(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (e instanceof ApiError) return e.message
  if (e instanceof Error && e.message) return e.message
  return fallback
}

// ───────── in-memory access token (never persisted) ─────────

let accessToken: string | null = null
let accessExpiresAt = 0

export const tokenStore = {
  get: () => accessToken,
  set(token: string, expiresAtIso: string) {
    accessToken = token
    accessExpiresAt = new Date(expiresAtIso).getTime()
  },
  clear() {
    accessToken = null
    accessExpiresAt = 0
  },
  /** True when the token is missing or within 15s of expiry. */
  stale: () => !accessToken || Date.now() > accessExpiresAt - 15_000,
}

export const AUTH_LOST_EVENT = 'cashmouver:auth-lost'

type RefreshResult = { accessToken: string; accessTokenExpiresAt: string; sessionId: string }

let refreshing: Promise<boolean> | null = null

/**
 * Exchanges the httpOnly refresh cookie for a new access token. Calls are
 * de-duplicated so a burst of 401s triggers a single rotation (a second
 * rotation would look like refresh-token reuse to the server).
 */
export function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
        if (!res.ok) return false
        const body = (await res.json()) as ApiSuccess<RefreshResult>
        if (!body.success) return false
        tokenStore.set(body.data.accessToken, body.data.accessTokenExpiresAt)
        return true
      } catch {
        return false
      } finally {
        setTimeout(() => (refreshing = null), 0)
      }
    })()
  }
  return refreshing
}

const http = axios.create({ baseURL: API_URL, timeout: 30_000, headers: { Accept: 'application/json' } })

http.interceptors.request.use(async (config) => {
  if (!config.headers.has('Authorization')) {
    if (tokenStore.get() && tokenStore.stale()) await refreshSession()
    const t = tokenStore.get()
    if (t) config.headers.set('Authorization', `Bearer ${t}`)
  }
  return config
})

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  const ax = err as AxiosError<ApiFailure>
  const body = ax.response?.data
  if (body && body.error) return new ApiError(body.error.message, body.error.code, ax.response!.status, body.error.details)
  if (ax.code === 'ECONNABORTED') return new ApiError('The request timed out. Please try again.', 'TIMEOUT', 0)
  if (!ax.response) return new ApiError('Cannot reach CashMouver. Check your connection.', 'NETWORK', 0)
  return new ApiError(ax.message, 'INTERNAL_ERROR', ax.response.status)
}

async function send<T, M>(config: AxiosRequestConfig, retried = false): Promise<ApiSuccess<T, M>> {
  try {
    const res = await http.request<ApiSuccess<T, M>>(config)
    return res.data
  } catch (e) {
    const err = toApiError(e)
    const isAuthCall = String(config.url ?? '').startsWith('/auth/')
    if (!retried && err.status === 401 && err.code !== 'TWO_FACTOR_REQUIRED' && !isAuthCall && tokenStore.get() !== null) {
      if (await refreshSession()) {
        const retryConfig = { ...config }
        retryConfig.headers = { ...(config.headers as Record<string, string> | undefined), Authorization: `Bearer ${tokenStore.get()}` }
        return send<T, M>(retryConfig, true)
      }
      tokenStore.clear()
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_LOST_EVENT))
    }
    throw err
  }
}

export interface Page<T> {
  items: T[]
  meta: PageMeta
}

type Params = Record<string, unknown> | undefined

function clean(params: Params) {
  if (!params) return undefined
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
}

export const api = {
  async get<T>(url: string, params?: Params): Promise<T> {
    return (await send<T, never>({ method: 'GET', url, params: clean(params) })).data
  },
  async page<T>(url: string, params?: Params): Promise<Page<T>> {
    const r = await send<T[], PageMeta>({ method: 'GET', url, params: clean(params) })
    return { items: r.data, meta: r.meta }
  },
  async post<T>(url: string, body?: unknown): Promise<T> {
    return (await send<T, never>({ method: 'POST', url, data: body ?? {} })).data
  },
  async put<T>(url: string, body?: unknown): Promise<T> {
    return (await send<T, never>({ method: 'PUT', url, data: body })).data
  },
  async patch<T>(url: string, body?: unknown): Promise<T> {
    return (await send<T, never>({ method: 'PATCH', url, data: body })).data
  },
  async del<T = { removed: boolean }>(url: string, body?: unknown): Promise<T> {
    return (await send<T, never>({ method: 'DELETE', url, data: body })).data
  },
  /** multipart upload — the browser sets the boundary. */
  async upload<T>(url: string, form: FormData): Promise<T> {
    return (await send<T, never>({ method: 'POST', url, data: form, headers: { 'Content-Type': 'multipart/form-data' } })).data
  },
}

/** Calls the same-origin /api/auth handlers that own the refresh-token cookie. */
export async function authCall<T>(action: 'login' | 'register' | 'logout' | 'change-password', body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const t = tokenStore.get()
  if (t) headers.Authorization = `Bearer ${t}`
  let res: Response
  try {
    res = await fetch(`/api/auth/${action}`, { method: 'POST', headers, credentials: 'same-origin', body: JSON.stringify(body ?? {}) })
  } catch {
    throw new ApiError('Cannot reach CashMouver. Check your connection.', 'NETWORK', 0)
  }
  const json = (await res.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null
  if (!json) throw new ApiError('Unexpected server response.', 'INTERNAL_ERROR', res.status)
  if (!json.success) throw new ApiError(json.error.message, json.error.code, res.status, json.error.details)
  return json.data
}
