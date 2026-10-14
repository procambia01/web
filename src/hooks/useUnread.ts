'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

/** Real unread counters from the server — polled while the tab is visible. */
export function useUnread() {
  const authed = useAuthStore((s) => s.status === 'authed')
  const notifications = useQuery({
    queryKey: ['unread', 'notifications'],
    queryFn: () => api.get<{ unread: number }>('/notifications/unread-count'),
    enabled: authed,
    refetchInterval: 30_000,
  })
  const messages = useQuery({
    queryKey: ['unread', 'messages'],
    queryFn: () => api.get<{ unread: number }>('/conversations/unread-count'),
    enabled: authed,
    refetchInterval: 30_000,
  })
  return { notifications: notifications.data?.unread ?? 0, messages: messages.data?.unread ?? 0 }
}
