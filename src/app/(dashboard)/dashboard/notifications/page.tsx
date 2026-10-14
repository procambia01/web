'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { NotificationDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { useNotificationNav } from '@/hooks/useNotificationNav'
import { timeAgo } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { Pager } from '@/components/shared/Pager'
import { cn } from '@/lib/utils'

export default function NotificationsPage() {
  const qc = useQueryClient()
  const go = useNotificationNav()
  const [page, setPage] = useState(1)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const q = useQuery({ queryKey: ['notifications', page, unreadOnly], queryFn: () => api.page<NotificationDto>('/notifications', { page, perPage: 20, unreadOnly: unreadOnly || undefined }) })
  const invalidate = () => { void qc.invalidateQueries({ queryKey: ['notifications'] }); void qc.invalidateQueries({ queryKey: ['unread'] }) }
  const readAll = useMutation({ mutationFn: () => api.post('/notifications/read-all'), onSuccess: invalidate, onError: (e) => toast.error(errorMessage(e)) })
  const remove = useMutation({ mutationFn: (id: string) => api.del(`/notifications/${id}`), onSuccess: invalidate, onError: (e) => toast.error(errorMessage(e)) })

  return (
    <div className="max-w-3xl">
      <PageHeader title="Notifications" actions={<Button variant="outline" onClick={() => readAll.mutate()} disabled={readAll.isPending}><CheckCheck size={14} /> Mark all read</Button>} />
      <div className="mb-4 flex gap-2" role="tablist">
        {[[false, 'All'], [true, 'Unread']].map(([v, l]) => (
          <button key={String(l)} role="tab" aria-selected={unreadOnly === v} onClick={() => { setUnreadOnly(v as boolean); setPage(1) }} className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium', unreadOnly === v ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)]')}>{l as string}</button>
        ))}
      </div>
      {q.isLoading ? <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> :
        q.data!.items.length === 0 ? <EmptyState icon={<Bell size={28} />} title={unreadOnly ? 'You\'re all caught up' : 'No notifications yet'} description="Swap requests, messages, payments and rate alerts will show up here." /> : (
          <>
            <ul className="space-y-2">
              {q.data!.items.map((n) => (
                <li key={n.id} className={cn('flex items-start gap-3 rounded-2xl border bg-[var(--color-surface)] p-4', n.isRead ? 'border-[var(--color-border)]' : 'border-[var(--color-primary)]/40')}>
                  <button className="min-w-0 flex-1 text-left" onClick={() => go(n)}>
                    <p className="flex items-center gap-2 text-sm font-semibold">{!n.isRead && <span aria-label="Unread" className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}{n.title}</p>
                    <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{n.message}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{timeAgo(n.createdAt)}</p>
                  </button>
                  <Button variant="ghost" size="icon-sm" aria-label="Delete notification" onClick={() => remove.mutate(n.id)}><Trash2 size={14} /></Button>
                </li>
              ))}
            </ul>
            <Pager meta={q.data!.meta} onPage={setPage} />
          </>
        )}
    </div>
  )
}
