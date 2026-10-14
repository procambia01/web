import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_REFRESH_TOKEN, REFRESH_COOKIE_OPTIONS, SERVER_API_URL } from '@/lib/server-auth'

/**
 * Thin session proxy. The browser never sees or stores the refresh token:
 * it is moved into an httpOnly, SameSite=Strict cookie here, and stripped
 * from the JSON handed back to the page.
 */
const ACTIONS: Record<string, { path: string; auth: boolean; setsSession: boolean }> = {
  login: { path: '/auth/login', auth: false, setsSession: true },
  register: { path: '/auth/register', auth: false, setsSession: true },
  refresh: { path: '/auth/refresh', auth: false, setsSession: true },
  logout: { path: '/auth/logout', auth: true, setsSession: false },
  'change-password': { path: '/auth/change-password', auth: true, setsSession: true },
}

interface Tokens {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  sessionId: string
}

function fail(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, data: null, error: { code, message } }, { status })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params
  const spec = ACTIONS[action]
  if (!spec) return fail('NOT_FOUND', 'Unknown action', 404)

  // Same-origin only: SameSite=Strict covers cookies, this covers a forged cross-site POST.
  const origin = req.headers.get('origin')
  if (origin && origin !== req.nextUrl.origin) return fail('FORBIDDEN', 'Cross-origin request refused', 403)

  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'User-Agent': req.headers.get('user-agent') ?? 'cashmouver-web' }
  const fwd = req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip')
  if (fwd) headers['X-Forwarded-For'] = fwd
  if (spec.auth) {
    const a = req.headers.get('authorization')
    if (a) headers.Authorization = a
  }

  let payload: Record<string, unknown> = {}
  if (action === 'refresh') {
    const rt = req.cookies.get(COOKIE_REFRESH_TOKEN)?.value
    if (!rt) return fail('UNAUTHORIZED', 'No session', 401)
    payload = { refreshToken: rt }
  } else {
    payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
  }

  let upstream: Response
  try {
    upstream = await fetch(`${SERVER_API_URL}${spec.path}`, { method: 'POST', headers, body: JSON.stringify(payload), cache: 'no-store' })
  } catch {
    return fail('SERVICE_UNAVAILABLE', 'CashMouver is temporarily unreachable.', 503)
  }
  const json = (await upstream.json().catch(() => null)) as { success: boolean; data: unknown; error?: unknown } | null
  if (!json) return fail('INTERNAL_ERROR', 'Unexpected server response.', 502)

  const clear = { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 }
  if (action === 'logout') {
    const res = NextResponse.json(json, { status: upstream.status })
    res.cookies.set(COOKIE_REFRESH_TOKEN, '', clear)
    return res
  }
  if (!upstream.ok || !json.success) {
    const res = NextResponse.json(json, { status: upstream.status })
    // A refused refresh means the session is dead — drop the cookie so we stop retrying.
    if (action === 'refresh' && upstream.status === 401) res.cookies.set(COOKIE_REFRESH_TOKEN, '', clear)
    return res
  }

  if (spec.setsSession) {
    const data = json.data as { tokens?: Tokens } & Partial<Tokens>
    const tokens: Tokens | undefined = data.tokens ?? (data.refreshToken ? (data as Tokens) : undefined)
    if (tokens) {
      const safe: Partial<Tokens> = { ...tokens }
      delete safe.refreshToken
      const body = data.tokens ? { ...data, tokens: safe } : safe
      const res = NextResponse.json({ ...json, data: body }, { status: upstream.status })
      res.cookies.set(COOKIE_REFRESH_TOKEN, tokens.refreshToken, REFRESH_COOKIE_OPTIONS)
      return res
    }
  }
  return NextResponse.json(json, { status: upstream.status })
}
