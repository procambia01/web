'use client'
import { NativeSelect } from '@/components/ui/field'
import { useCurrencies } from '@/hooks/useCurrencies'

/** Options come from the admin-managed currency list, popular ones first. */
export function CurrencySelect({ value, onChange, exclude, placeholder = 'Currency', invalid, id, includeAny }: {
  value: string
  onChange: (code: string) => void
  exclude?: string
  placeholder?: string
  invalid?: boolean
  id?: string
  includeAny?: boolean
}) {
  const { currencies, isLoading } = useCurrencies()
  const sorted = [...currencies].filter((c) => c.code !== exclude).sort((a, b) => Number(b.isPopular) - Number(a.isPopular) || a.sortOrder - b.sortOrder || a.code.localeCompare(b.code))
  return (
    <NativeSelect id={id} value={value} invalid={invalid} onChange={(e) => onChange(e.target.value)} disabled={isLoading}>
      <option value="">{includeAny ? 'Any currency' : placeholder}</option>
      {sorted.map((c) => (
        <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
      ))}
    </NativeSelect>
  )
}
