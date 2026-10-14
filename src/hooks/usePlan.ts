'use client'
import { useQuery } from '@tanstack/react-query'
import type { EntitlementsDto, ServiceProductDto } from '@/contracts'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export function useEntitlements() {
  const authed = useAuthStore((s) => s.status === 'authed')
  return useQuery({ queryKey: ['entitlements'], queryFn: () => api.get<EntitlementsDto>('/users/me/entitlements'), enabled: authed })
}

export function useProducts(kind?: string) {
  return useQuery({ queryKey: ['products', kind ?? 'all'], queryFn: () => api.get<ServiceProductDto[]>('/products', { kind }), staleTime: 5 * 60_000 })
}
