/**
 * Display-only decimal helpers on BigInt. The server is the source of truth
 * for every amount; this exists so the UI can PREVIEW "amount × rate"
 * without binary floating point.
 */
function parts(v: string): { int: bigint; scale: number } {
  const [i, f = ''] = v.split('.')
  return { int: BigInt(i + f), scale: f.length }
}

/** a × b, returned as a decimal string rounded half-up to `places`. */
export function mulDecimal(a: string, b: string, places: number): string | null {
  if (!/^\d+(\.\d+)?$/.test(a) || !/^\d+(\.\d+)?$/.test(b)) return null
  const x = parts(a)
  const y = parts(b)
  const prod = x.int * y.int
  const scale = x.scale + y.scale
  let out: bigint
  if (scale > places) {
    const div = 10n ** BigInt(scale - places)
    out = (prod + div / 2n) / div
  } else {
    out = prod * 10n ** BigInt(places - scale)
  }
  const s = out.toString().padStart(places + 1, '0')
  return places === 0 ? s : `${s.slice(0, -places)}.${s.slice(-places)}`
}

/** a ≥ b for non-negative decimal strings. */
export function gteDecimal(a: string, b: string): boolean {
  if (!/^\d+(\.\d+)?$/.test(a) || !/^\d+(\.\d+)?$/.test(b)) return false
  const x = parts(a)
  const y = parts(b)
  const s = Math.max(x.scale, y.scale)
  return x.int * 10n ** BigInt(s - x.scale) >= y.int * 10n ** BigInt(s - y.scale)
}
