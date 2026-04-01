'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { messageService } from '@/services'
import { UserAvatar } from '@/components/ui/user-avatar'
import { PageHeader } from '@/components/ui/page-header'
import { formatMessageTime, formatCurrency } from '@/lib/format'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

function formatMessageTime2(d: string): string {
  const now  = Date.now()
  const date = new Date(d).getTime()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 86400) return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604800) return new Date(d).toLocaleDateString('en-GB', { weekday: 'short' })
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

interface Conversation {
  swapId: string
  participant: { id: string; name: string; image: string | null }
  lastMessage: { content: string; senderId: string; createdAt: string; messageType: string } | null
  unreadCount: number
  swap: { id: string; status: string; initiatorGivesCurrency: string; initiatorGivesAmount: number; receiverGivesCurrency: string; receiverGivesAmount: number }
}

export default function MessagesPage() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn:  messageService.getConversations as () => Promise<{ data: Conversation[] }>,
    refetchInterval: 15000,
  })

  const conversations = (data?.data ?? []) as Conversation[]
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-5">
      <PageHeader
        title="Messages"
        description={totalUnread > 0 ? `${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}` : 'Your swap conversations'}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center shadow-[var(--shadow-sm)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-[var(--color-primary)]" />
          </div>
          <p className="font-display font-bold text-[var(--color-text-primary)]">No conversations yet</p>
          <p className="text-sm text-[var(--color-text-muted)] font-body mt-1">
            Your swap conversations will appear here
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] divide-y divide-[var(--color-divider)] overflow-hidden">
          {conversations.map((conv) => {
            const hasUnread    = conv.unreadCount > 0
            const isMe         = conv.lastMessage?.senderId === user?.id
            const swapSummary  = `${formatCurrency(conv.swap.initiatorGivesAmount, conv.swap.initiatorGivesCurrency)} ↔ ${formatCurrency(conv.swap.receiverGivesAmount, conv.swap.receiverGivesCurrency)}`

            return (
              <Link
                key={conv.swapId}
                href={`/dashboard/messages/${conv.swapId}`}
                className={cn(
                  'flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-bg)] transition-colors group',
                  hasUnread && 'bg-[var(--color-primary-light)]/30',
                )}
              >
                <div className="relative shrink-0">
                  <UserAvatar name={conv.participant.name} image={conv.participant.image} size="md" />
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-surface)]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn(
                      'text-sm font-body truncate',
                      hasUnread ? 'font-bold text-[var(--color-text-primary)]' : 'font-semibold text-[var(--color-text-primary)]',
                    )}>
                      {conv.participant.name}
                    </p>
                    {conv.lastMessage && (
                      <p className={cn(
                        'text-xs font-body shrink-0 ml-2',
                        hasUnread ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)]',
                      )}>
                        {formatMessageTime2(conv.lastMessage.createdAt)}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-[var(--color-primary)] font-body font-medium truncate">{swapSummary}</p>

                  <div className="flex items-center justify-between mt-0.5">
                    <p className={cn(
                      'text-xs font-body truncate flex-1',
                      hasUnread ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-muted)]',
                    )}>
                      {conv.lastMessage
                        ? conv.lastMessage.messageType === 'SYSTEM'
                          ? `📋 ${conv.lastMessage.content}`
                          : conv.lastMessage.messageType === 'IMAGE'
                          ? '📷 Image'
                          : isMe ? `You: ${conv.lastMessage.content}` : conv.lastMessage.content
                        : 'No messages yet'}
                    </p>
                    {hasUnread && (
                      <span className="ml-2 min-w-[20px] h-5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center px-1.5 font-body shrink-0">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                <ArrowRight size={15} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
