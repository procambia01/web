/**
 * Admin screens receive raw minor-unit integers (cents, yen…). These helpers
 * convert to/from decimal strings with BigInt — never floating point.
 */
export function minorToDecimal(minor: string | number | bigint, unit: number): string {
  const neg = String(minor).startsWith('-')
  const digits = String(minor).replace('-', '')
  if (!/^\d+$/.test(digits)) return String(minor)
  if (unit === 0) return (neg ? '-' : '') + digits
  const p = digits.padStart(unit + 1, '0')
  return `${neg ? '-' : ''}${p.slice(0, -unit)}.${p.slice(-unit)}`
}

/** "12.5" with unit 2 → "1250". Returns null when the input has too many decimals or is not a number. */
export function decimalToMinor(input: string, unit: number): string | null {
  const v = input.trim()
  const m = /^(\d{1,15})(?:\.(\d*))?$/.exec(v)
  if (!m) return null
  const frac = m[2] ?? ''
  if (frac.length > unit) return null
  const out = BigInt(m[1] + frac.padEnd(unit, '0')).toString()
  return out
}
