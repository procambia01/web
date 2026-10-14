'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import type { ConversationDto } from '@/contracts'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { UserAvatar } from '@/components/ui/user-avatar'
import { SwapStatusBadge } from '@/components/ui/status-badge'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { Pager } from '@/components/shared/Pager'
import { timeAgo } from '@/lib/format'

export default function MessagesPage() {
  const [page, setPage] = useState(1)
  const q = useQuery({ queryKey: ['conversations', page], queryFn: () => api.page<ConversationDto>('/conversations', { page, perPage: 20 }) })
  return (
    <div className="max-w-3xl">
      <PageHeader title="Messages" description="Every conversation is tied to a swap." />
      {q.isLoading ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> :
        q.data!.items.length === 0 ? <EmptyState title="No conversations yet" description="When you request or accept a swap you can chat with the other member here." /> : (
          <>
            <ul className="space-y-2">
              {q.data!.items.map((c) => (
                <li key={c.swapId}>
                  <Link href={`/dashboard/messages/${c.swapId}`} className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:shadow-[var(--shadow-md)]">
                    <UserAvatar name={c.other.name} image={c.other.image} verified={c.other.verified} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2"><p className="truncate font-semibold">{c.other.name}</p><span className="shrink-0 text-xs text-[var(--color-text-muted)]">{timeAgo(c.lastMessage?.createdAt)}</span></div>
                      <p className="truncate text-sm text-[var(--color-text-secondary)]">{c.lastMessage ? (c.lastMessage.isDeleted ? 'Message removed' : c.lastMessage.content || 'Image') : 'No messages yet'}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1"><SwapStatusBadge status={c.swapStatus} />{c.unreadCount > 0 && <span className="rounded-full bg-[var(--color-primary)] px-2 text-xs font-bold text-white">{c.unreadCount}</span>}</div>
                  </Link>
                </li>
              ))}
            </ul>
            <Pager meta={q.data!.meta} onPage={setPage} />
          </>
        )}
    </div>
  )
}
