'use client'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { WEB_PATHS, type NotificationDto } from '@/contracts'
import { api } from '@/lib/api'

/** One place that turns a notification into a destination (shared mapping from the contracts). */
export function useNotificationNav() {
  const router = useRouter()
  const qc = useQueryClient()
  return async (n: NotificationDto) => {
    if (!n.isRead) {
      try {
        await api.post(`/notifications/${n.id}/read`)
        void qc.invalidateQueries({ queryKey: ['unread'] })
        void qc.invalidateQueries({ queryKey: ['notifications'] })
      } catch {
        /* navigation still proceeds */
      }
    }
    router.push(WEB_PATHS[n.route](n.entityId))
  }
}
