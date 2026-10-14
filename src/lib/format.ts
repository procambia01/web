import type { CurrencyDto } from '@/contracts'

/**
 * Money arrives as decimal STRINGS ("1500.50"). They are formatted with Intl
 * (which accepts decimal strings) and never run through parseFloat, so there
 * is no binary-float rounding on the way to the screen.
 */
export function formatMoney(amount: string | null | undefined, code: string, currencies?: CurrencyDto[]): string {
  if (amount === null || amount === undefined || amount === '') return '—'
  const minor = currencies?.find((c) => c.code === code)?.minorUnit
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: minor ?? undefined,
      maximumFractionDigits: minor ?? 2,
    }).format(amount as unknown as number)
  } catch {
    return `${amount} ${code}`
  }
}

/** Plain number with grouping but no currency symbol — for amount inputs and rates. */
export function formatNumber(value: string | null | undefined, maxFraction = 6): string {
  if (value === null || value === undefined || value === '') return '—'
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: maxFraction }).format(value as unknown as number)
  } catch {
    return value
  }
}

/** Exchange rates keep up to 6 significant decimals but drop trailing zeros. */
export function formatRate(rate: string | null | undefined): string {
  return formatNumber(rate, 6)
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso))
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const mins = Math.round(diff / 60_000)
  if (Math.abs(mins) < 1) return rtf.format(0, 'minute')
  if (Math.abs(mins) < 60) return rtf.format(-mins, 'minute')
  const hours = Math.round(mins / 60)
  if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-Math.round(hours / 24), 'day')
}

/** Time left until `iso`, e.g. "2h 15m"; "Expired" once passed. */
export function timeLeft(iso: string | null | undefined): string {
  if (!iso) return ''
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const m = Math.floor(ms / 60_000)
  const d = Math.floor(m / 1440)
  if (d > 0) return `${d}d ${Math.floor((m % 1440) / 60)}h`
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'U'
}

/** ISO country code → flag emoji (works for any region, no hardcoded list). */
export function flagEmoji(country: string | null | undefined): string {
  if (!country || country.length !== 2) return ''
  return String.fromCodePoint(...country.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0)))
}

export function enumLabel(v: string): string {
  return v.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

/** Local `datetime-local` value → ISO string for the API. */
export function localToIso(local: string): string {
  return new Date(local).toISOString()
}
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso)
  const off = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}
