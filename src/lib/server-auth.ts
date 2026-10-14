import { COOKIE_REFRESH_TOKEN } from './constants'

export const SERVER_API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
}

export { COOKIE_REFRESH_TOKEN }
