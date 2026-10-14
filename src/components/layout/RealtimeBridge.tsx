'use client'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/auth.store'

/** Turns server pushes into cache invalidations so counters, chat and notifications stay live. */
export function RealtimeBridge() {
  const authed = useAuthStore((s) => s.status === 'authed')
  const qc = useQueryClient()

  useEffect(() => {
    if (!authed) return
    const s = getSocket()
    const refreshMessages = (p?: { swapId?: string }) => {
      void qc.invalidateQueries({ queryKey: ['unread'] })
      void qc.invalidateQueries({ queryKey: ['conversations'] })
      if (p?.swapId) void qc.invalidateQueries({ queryKey: ['messages', p.swapId] })
      else void qc.invalidateQueries({ queryKey: ['messages'] })
    }
    const refreshNotifs = () => {
      void qc.invalidateQueries({ queryKey: ['unread'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    }
    s.on('message:new', refreshMessages)
    s.on('message:read', refreshMessages)
    s.on('message:updated', refreshMessages)
    s.on('message:deleted', refreshMessages)
    s.on('message:unread', refreshMessages)
    s.on('notification:new', refreshNotifs)
    s.on('notification:unread', refreshNotifs)
    s.connect()
    return () => {
      s.removeAllListeners()
      disconnectSocket()
    }
  }, [authed, qc])

  return null
}
