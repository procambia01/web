import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'
import { API_URL, COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from './constants'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request: attach token ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get(COOKIE_ACCESS_TOKEN)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: handle 401 / refresh ───────────────────────
let isRefreshing = false
let queue: Array<(token: string) => void> = []

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (err.response?.status !== 401 || original._retry) return Promise.reject(err)

    if (isRefreshing) {
      return new Promise(resolve => {
        queue.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refresh = Cookies.get(COOKIE_REFRESH_TOKEN)
      if (!refresh) throw new Error('no refresh token')

      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh })
      const { accessToken, refreshToken } = data.data

      Cookies.set(COOKIE_ACCESS_TOKEN,  accessToken,  { expires: 7,  sameSite: 'strict' })
      Cookies.set(COOKIE_REFRESH_TOKEN, refreshToken, { expires: 30, sameSite: 'strict' })

      queue.forEach(cb => cb(accessToken))
      queue = []
      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)
    } catch {
      queue = []
      Cookies.remove(COOKIE_ACCESS_TOKEN)
      Cookies.remove(COOKIE_REFRESH_TOKEN)
      window.location.href = '/login'
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)

export default api

// ── Typed helpers ─────────────────────────────────────────
export type ApiResponse<T> = { success: boolean; message: string; data: T }
export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: { page: number; perPage: number; total: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean }
}

export const apiGet  = <T>(url: string, cfg?: AxiosRequestConfig) =>
  api.get<ApiResponse<T>>(url, cfg).then(r => r.data)

export const apiPost = <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig) =>
  api.post<ApiResponse<T>>(url, data, cfg).then(r => r.data)

export const apiPatch  = <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig) =>
  api.patch<ApiResponse<T>>(url, data, cfg).then(r => r.data)

export const apiDelete = <T>(url: string, cfg?: AxiosRequestConfig) =>
  api.delete<ApiResponse<T>>(url, cfg).then(r => r.data)

export const apiPaginated = <T>(url: string, cfg?: AxiosRequestConfig) =>
  api.get<PaginatedResponse<T>>(url, cfg).then(r => r.data)
