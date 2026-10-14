import { PRODUCT_DOMAIN, PRODUCT_NAME } from '@/contracts'

export const APP_NAME = PRODUCT_NAME
export const APP_DOMAIN = PRODUCT_DOMAIN
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? `https://${PRODUCT_DOMAIN}`
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:8080'

/**
 * httpOnly cookie that holds the opaque refresh token. It is set and cleared
 * only by the /api/auth route handlers, never by browser JavaScript.
 */
export const COOKIE_REFRESH_TOKEN = 'cm_rt'

/** Demonstration cities used for placeholders only — never as data. */
export const EXAMPLE_CITIES = ['London', 'Paris', 'Berlin', 'Madrid', 'Amsterdam', 'Zurich'] as const

export const SWAP_STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  AGREED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
  CONFIRMING: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  DISPUTED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

export const OFFER_STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  COMPLETED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  CANCELLED: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
  EXPIRED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export const DEFAULT_PER_PAGE = 20

export const DISPUTE_VARIANT = { OPEN: 'warning', INVESTIGATING: 'info', RESOLVED: 'success', CLOSED: 'neutral' } as const
