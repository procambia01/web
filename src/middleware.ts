import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_REFRESH_TOKEN } from '@/lib/constants'

/**
 * Cheap gate: signed-out visitors never get the dashboard shell. Real
 * authorization (including role checks for /admin) always happens on the API.
 */
export function middleware(req: NextRequest) {
  const has = req.cookies.has(COOKIE_REFRESH_TOKEN)
  const { pathname } = req.nextUrl
  if (!has && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*', '/admin/:path*'] }
