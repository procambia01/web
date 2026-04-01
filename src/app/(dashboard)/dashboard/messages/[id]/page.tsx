'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Image as ImageIcon, Check, CheckCheck, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { messageService } from '@/services'
import { useAuthStore } from '@/store/auth.store'
import { UserAvatar } from '@/components/ui/user-avatar'
import { SwapStatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'

// ── Date separator ────────────────────────────────────────
function DateSep({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-[var(--color-divider)]" />
      <span className="text-[10px] text-[var(--color-text-muted)] font-body font-semibold px-2">{date}</span>
      <div className="flex-1 h-px bg-[var(--color-divider)]" />
    </div>
  )
}

// ── Message bubble ────────────────────────────────────────
function Bubble({ msg, isMe, showAvatar }: { msg: Message; isMe: boolean; showAvatar: boolean }) {
  if (msg.messageType === 'SYSTEM') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-[var(--color-text-muted)] font-body bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full px-3 py-1">
          {msg.content}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-end gap-2 mb-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
      {!isMe && (
        <div className={cn('shrink-0 mb-1', !showAvatar && 'invisible')}>
          <UserAvatar name={msg.sender.name} image={msg.sender.image} size="xs" />
        </div>
      )}

      <div className={cn('max-w-[72%] flex flex-col', isMe ? 'items-end' : 'items-start')}>
        <div className={cn(
          'px-3.5 py-2.5 rounded-2xl text-sm font-body leading-relaxed',
          isMe
            ? 'bg-[var(--color-primary)] text-white rounded-br-sm'
            : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-bl-sm shadow-[var(--shadow-xs)]',
        )}>
          {msg.messageType === 'IMAGE' && msg.attachments[0] ? (
            <img src={msg.attachments[0]} alt="attachment" className="rounded-xl max-w-[240px] max-h-[200px] object-cover" />
          ) : (
            msg.content
          )}
        </div>
        <div className={cn('flex items-center gap-1 mt-1 px-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[10px] text-[var(--color-text-muted)] font-body">{formatTime(msg.createdAt)}</span>
          {isMe && (
            msg.isRead
              ? <CheckCheck size={12} className="text-blue-400" />
              : <Check size={12} className="text-[var(--color-text-muted)]" />
          )}
          {msg.isEdited && <span className="text-[10px] text-[var(--color-text-muted)] font-body italic">edited</span>}
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const { user }  = useAuthStore()
  const qc        = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  const [text, setText]           = useState('')
  const [sending, setSending]     = useState(false)
  const [optimistic, setOptimistic] = useState<Message[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn:  () => messageService.getMessages(id, { perPage: 50 }),
    refetchInterval: 5000,
  })

  const { data: swapData } = useQuery({
    queryKey: ['swap-for-chat', id],
    queryFn:  async () => {
      const { swapService } = await import('@/services')
      return swapService.getById(id)
    },
  })

  const swap = swapData?.data
  const messages = [...(data?.data ?? []).slice().reverse(), ...optimistic]

  // Scroll to bottom when messages load
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Mark as read on load
  useEffect(() => {
    messageService.markRead(id).catch(() => {})
  }, [id])

  const handleSend = useCallback(async () => {
    const content = text.trim()
    if (!content || sending) return
    setText('')

    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = {
      id: tempId, swapId: id, senderId: user?.id ?? '',
      sender: { id: user?.id ?? '', name: user?.name ?? '', image: null },
      content, messageType: 'TEXT', attachments: [],
      isRead: false, readAt: null, isEdited: false,
      createdAt: new Date().toISOString(),
    }
    setOptimistic(prev => [...prev, tempMsg])
    setSending(true)

    try {
      const res = await messageService.send(id, content)
      setOptimistic(prev => prev.filter(m => m.id !== tempId))
      qc.invalidateQueries({ queryKey: ['messages', id] })
    } catch {
      setOptimistic(prev => prev.filter(m => m.id !== tempId))
      setText(content)
    } finally {
      setSending(false)
    }
  }, [text, sending, id, user, qc])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // Group by date
  type GroupItem = { type: 'date'; label: string } | { type: 'msg'; msg: Message; isMe: boolean; showAvatar: boolean }
  const grouped: GroupItem[] = []
  let lastDate = ''
  let lastSender = ''
  messages.forEach((msg, i) => {
    const d = formatDate(msg.createdAt)
    if (d !== lastDate) { grouped.push({ type: 'date', label: d }); lastDate = d }
    const isMe      = msg.senderId === user?.id
    const showAvatar = !isMe && msg.senderId !== lastSender
    grouped.push({ type: 'msg', msg, isMe, showAvatar })
    lastSender = msg.senderId
  })

  const partner = swap
    ? (swap.initiatorId === user?.id ? swap.receiver : swap.initiator)
    : null

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 bg-[var(--color-surface)] border-b border-[var(--color-border)] shrink-0">
        <button onClick={() => router.back()}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors">
          <ArrowLeft size={18} />
        </button>

        {partner && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <UserAvatar name={partner.name} image={partner.image} size="sm" verified={partner.idVerified} />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[var(--color-text-primary)] font-body truncate">{partner.name}</p>
              {swap && (
                <p className="text-xs text-[var(--color-text-muted)] font-body truncate">
                  {formatCurrency(swap.initiatorGivesAmount, swap.initiatorGivesCurrency)} ↔ {formatCurrency(swap.receiverGivesAmount, swap.receiverGivesCurrency)}
                </p>
              )}
            </div>
          </div>
        )}
        {!partner && <div className="flex-1" />}

        <div className="flex items-center gap-2">
          {swap && <SwapStatusBadge status={swap.status} />}
          <button
            onClick={() => router.push(`/dashboard/swaps/${id}`)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
            title="Swap details"
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-[var(--color-bg)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-7 h-7 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {grouped.map((item, i) =>
              item.type === 'date'
                ? <DateSep key={`date-${i}`} date={item.label} />
                : <Bubble key={item.msg.id} msg={item.msg} isMe={item.isMe} showAvatar={item.showAvatar} />
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-4 sm:px-6 py-3 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="flex items-end gap-2.5">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors shrink-0 mb-0.5">
            <ImageIcon size={18} />
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              style={{ resize: 'none' }}
              className={cn(
                'w-full px-4 py-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]',
                'text-sm font-body text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
                'outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
                'max-h-32 overflow-y-auto transition-all',
              )}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-0.5 transition-all',
              text.trim()
                ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-primary)] hover:bg-[var(--color-primary-dark)]'
                : 'bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed',
            )}
          >
            {sending
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Send size={16} />
            }
          </button>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)] font-body mt-1.5 text-center">
          Messages are end-to-end encrypted
        </p>
      </div>
    </div>
  )
}
