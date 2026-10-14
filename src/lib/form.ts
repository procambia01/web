import type { ZodTypeAny, z } from 'zod'
import { ApiError } from './api'

export type FieldErrors = Record<string, string>

/** Validates with a contracts schema and returns flat, per-field messages. */
export function validate<S extends ZodTypeAny>(schema: S, values: unknown): { data: z.output<S> | null; errors: FieldErrors } {
  const r = schema.safeParse(values)
  if (r.success) return { data: r.data, errors: {} }
  const errors: FieldErrors = {}
  for (const issue of r.error.issues) {
    const key = issue.path.join('.') || '_'
    if (!errors[key]) errors[key] = issue.message
  }
  return { data: null, errors }
}

/** Merges server-side validation details into form errors. */
export function serverErrors(e: unknown): FieldErrors {
  return e instanceof ApiError ? e.fieldErrors : {}
}

/** Parses a user-typed decimal ("1,500.50" or "1500,5") into the API's decimal string, or null. */
export function toDecimalString(input: string): string | null {
  const v = input.trim().replace(/\s/g, '')
  if (!v) return null
  const normalised = v.includes(',') && !v.includes('.') ? v.replace(',', '.') : v.replace(/,/g, '')
  return /^\d{1,18}(\.\d{1,10})?$/.test(normalised) ? normalised : null
}
