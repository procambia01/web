'use client'
import { useQuery } from '@tanstack/react-query'
import type { CurrencyDto } from '@/contracts'
import { api } from '@/lib/api'
import { formatMoney } from '@/lib/format'

/** The admin-managed list of active currencies — nothing about it is hardcoded. */
export function useCurrencies() {
  const q = useQuery({ queryKey: ['currencies'], queryFn: () => api.get<CurrencyDto[]>('/currencies'), staleTime: 10 * 60_000 })
  const list = q.data ?? []
  return {
    ...q,
    currencies: list,
    byCode: (code: string) => list.find((c) => c.code === code),
    minorUnit: (code: string) => list.find((c) => c.code === code)?.minorUnit ?? 2,
    money: (amount: string | null | undefined, code: string) => formatMoney(amount, code, list),
  }
}
