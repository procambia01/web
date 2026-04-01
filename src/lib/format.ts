import { CURRENCIES } from './constants'

// ── Currency ───────────────────────────────────────────────
export function formatCurrency(amount: number, code: string): string {
  const c = CURRENCIES.find(x => x.code === code)
  const symbol = c?.symbol ?? code
  return `${symbol}${formatNumber(amount)}`
}

export function getCurrencySymbol(code: string) {
  return CURRENCIES.find(x => x.code === code)?.symbol ?? code
}

export function getCurrencyFlag(code: string) {
  return CURRENCIES.find(x => x.code === code)?.flag ?? '🏳️'
}

export function getCurrencyName(code: string) {
  return CURRENCIES.find(x => x.code === code)?.name ?? code
}

// ── Numbers ───────────────────────────────────────────────
export function formatNumber(n: number, decimals = 2): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals })
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals })
}

export function formatPercent(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`
}

export function formatRating(n: number): string {
  return n.toFixed(1)
}

export function trustScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Very Good'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'New'
}

export function trustScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600'
  if (score >= 75) return 'text-blue-600'
  if (score >= 60) return 'text-amber-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-gray-500'
}

// ── Dates ─────────────────────────────────────────────────
export function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatTime(d: string | Date): string {
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(d: string | Date): string {
  return `${formatDate(d)}, ${formatTime(d)}`
}

export function formatRelative(d: string | Date): string {
  const now  = Date.now()
  const date = new Date(d).getTime()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(d)
}

// ── Text ──────────────────────────────────────────────────
export function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 3) + '…'
}

export function initials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
