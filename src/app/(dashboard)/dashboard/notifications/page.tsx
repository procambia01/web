'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { notificationService } from '@/services'
import { PageHeader } from '@/components/ui/page-header'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Notification } from '@/types'

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  MATCH_FOUND:            { icon: '✨', color: 'text-violet-600', bg: 'bg-violet-50' },
  SWAP_REQUEST:           { icon: '🔄', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]' },
  SWAP_ACCEPTED:          { icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  SWAP_REJECTED:          { icon: '❌', color: 'text-red-600', bg: 'bg-red-50' },
  MESSAGE_RECEIVED:       { icon: '💬', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]' },
  SWAP_COMPLETED:         { icon: '🏆', color: 'text-amber-600', bg: 'bg-amber-50' },
  SWAP_CANCELLED:         { icon: '🚫', color: 'text-gray-600', bg: 'bg-gray-100' },
  RATING_RECEIVED:        { icon: '⭐', color: 'text-amber-500', bg: 'bg-amber-50' },
  DISPUTE_FILED:          { icon: '⚠️', color: 'text-red-600', bg: 'bg-red-50' },
  DISPUTE_RESOLVED:       { icon: '🤝', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  VERIFICATION_APPROVED:  { icon: '🛡️', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  VERIFICATION_REJECTED:  { icon: '🚫', color: 'text-red-600', bg: 'bg-red-50' },
  PREMIUM_EXPIRING:       { icon: '💎', color: 'text-amber-600', bg: 'bg-amber-50' },
  ACCOUNT_WARNING:        { icon: '⚠️', color: 'text-amber-600', bg: 'bg-amber-50' },
  SYSTEM_ALERT:           { icon: '🔔', color: 'text-gray-600', bg: 'bg-gray-100' },
  DEFAULT:                { icon: '📢', color: 'text-gray-600', bg: 'bg-gray-100' },
}

function NotifItem({
  notif, onRead, onDelete,
}: { notif: Notification; onRead: (id: string) => void; onDelete: (id: string) => void }) {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.DEFAULT

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'flex items-start gap-4 px-5 py-4 border-b border-[var(--color-divider)] last:border-0 group transition-colors hover:bg-[var(--color-bg)]',
        !notif.isRead && 'bg-[var(--color-primary-light)]/20',
      )}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 mt-0.5', cfg.bg)}>
        {cfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm font-body',
            notif.isRead ? 'font-medium text-[var(--color-text-primary)]' : 'font-bold text-[var(--color-text-primary)]',
          )}>
            {notif.title}
          </p>
          <span className="text-[11px] text-[var(--color-text-muted)] font-body shrink-0 mt-0.5">
            {formatRelative(notif.createdAt)}
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] font-body mt-0.5 leading-relaxed">{notif.message}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notif.isRead && (
          <button
            onClick={() => onRead(notif.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
            title="Mark as read"
          >
            <CheckCheck size={14} />
          </button>
        )}
        <button
          onClick={() => onDelete(notif.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {!notif.isRead && (
        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-1.5" />
      )}
    </motion.div>
  )
}

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationService.getAll({ perPage: 50 }),
  })

  const notifications = data?.data ?? []
  const unread = notifications.filter(n => !n.isRead)

  const markRead = async (id: string) => {
    await notificationService.markRead(id)
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  const markAllRead = async () => {
    await notificationService.markAllRead()
    qc.invalidateQueries({ queryKey: ['notifications'] })
    toast.success('All marked as read')
  }

  const deleteNotif = async (id: string) => {
    await notificationService.delete(id)
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-5">
      <PageHeader
        title="Notifications"
        description={unread.length > 0 ? `${unread.length} unread` : 'You\'re all caught up'}
        actions={
          unread.length > 0 ? (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors font-body"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center shadow-[var(--shadow-sm)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-bg)] flex items-center justify-center mx-auto mb-4 border border-[var(--color-border)]">
            <Bell className="w-7 h-7 text-[var(--color-text-muted)]" />
          </div>
          <p className="font-display font-bold text-[var(--color-text-primary)]">No notifications</p>
          <p className="text-sm text-[var(--color-text-muted)] font-body mt-1">
            Swap updates and alerts will appear here
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] overflow-hidden">
          <AnimatePresence mode="popLayout">
            {notifications.map(n => (
              <NotifItem key={n.id} notif={n} onRead={markRead} onDelete={deleteNotif} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
