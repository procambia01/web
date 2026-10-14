'use client'
import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCheck, Flag, ImagePlus, Pencil, Send, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { MessageDto, PageMeta } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/auth.store'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/field'
import { Notice, Spinner } from '@/components/ui/states'
import { ConfirmDialog } from './ConfirmDialog'

function Attachment({ m, index }: { m: MessageDto; index: number }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    api.get<{ url: string }>(`/swaps/messages/${m.id}/attachments/${index}`).then((r) => live && setUrl(r.url)).catch(() => live && setFailed(true))
    return () => { live = false }
  }, [m.id, index])
  if (failed) return <p className="text-xs italic opacity-70">Image unavailable</p>
  if (!url) return <Spinner size={14} />
  // eslint-disable-next-line @next/next/no-img-element
  return <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="Shared in chat" className="max-h-56 rounded-lg" /></a>
}

/** Swap-linked chat. The server owns message creation; this only renders and calls it. */
export function ChatPanel({ swapId, disabled, disabledReason, className }: { swapId: string; disabled?: boolean; disabledReason?: string; className?: string }) {
  const me = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [editing, setEditing] = useState<MessageDto | null>(null)
  const [deleting, setDeleting] = useState<MessageDto | null>(null)
  const [reporting, setReporting] = useState<MessageDto | null>(null)
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const q = useInfiniteQuery({
    queryKey: ['messages', swapId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.page<MessageDto>(`/swaps/${swapId}/messages`, { page: pageParam, perPage: 30 }),
    getNextPageParam: (last) => (last.meta.hasNextPage ? last.meta.page + 1 : undefined),
    refetchInterval: 20_000,
  })
  // page 1 is the newest slice; older slices are appended, so render them oldest-first.
  const messages = (q.data?.pages ?? []).slice().reverse().flatMap((p) => p.items)
  const lastId = messages[messages.length - 1]?.id

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [lastId])

  const unreadFromOther = messages.some((m) => m.senderId !== me?.id && !m.readAt)
  useEffect(() => {
    if (unreadFromOther) {
      void api.post(`/swaps/${swapId}/messages/read`).then(() => qc.invalidateQueries({ queryKey: ['unread'] })).catch(() => undefined)
    }
  }, [unreadFromOther, swapId, qc])

  useEffect(() => {
    const s = getSocket()
    s.emit('swap:join', swapId)
    const onTyping = (p: { swapId?: string; userId?: string; typing?: boolean }) => {
      if (p.swapId === swapId && p.userId !== me?.id) {
        setTyping(!!p.typing)
        clearTimeout(typingTimer.current)
        if (p.typing) typingTimer.current = setTimeout(() => setTyping(false), 4000)
      }
    }
    s.on('typing', onTyping)
    return () => { s.emit('swap:leave', swapId); s.off('typing', onTyping); clearTimeout(typingTimer.current) }
  }, [swapId, me?.id])

  const done = () => { void qc.invalidateQueries({ queryKey: ['messages', swapId] }); void qc.invalidateQueries({ queryKey: ['conversations'] }) }
  const send = useMutation({
    mutationFn: (content: string) => (editing ? api.patch(`/swaps/messages/${editing.id}`, { content }) : api.post(`/swaps/${swapId}/messages`, { content })),
    onSuccess: () => { setText(''); setEditing(null); done() },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const upload = useMutation({
    mutationFn: (file: File) => { const f = new FormData(); f.append('image', file); return api.upload(`/swaps/${swapId}/messages/image`, f) },
    onSuccess: done,
    onError: (e) => toast.error(errorMessage(e)),
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = text.trim()
    if (v && !send.isPending) send.mutate(v)
  }

  return (
    <div className={cn('flex min-h-[28rem] flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]', className)}>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: '28rem' }} aria-live="polite">
        {q.hasNextPage && <div className="text-center"><Button variant="ghost" size="sm" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>Load earlier messages</Button></div>}
        {q.isLoading && <div className="flex justify-center py-8"><Spinner /></div>}
        {!q.isLoading && messages.length === 0 && <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">No messages yet. Say hello and agree where to meet.</p>}
        {messages.map((m) => {
          const mine = m.senderId === me?.id
          if (m.messageType === 'SYSTEM') return <p key={m.id} className="text-center text-xs text-[var(--color-text-muted)]">{m.content}</p>
          return (
            <div key={m.id} className={cn('group flex', mine ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[80%] rounded-2xl px-3.5 py-2 text-sm', mine ? 'rounded-br-md bg-[var(--color-primary)] text-white' : 'rounded-bl-md bg-[var(--color-bg)]')}>
                {m.isDeleted ? <em className="opacity-70">Message removed</em> : (
                  <>
                    {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                    {m.attachments.map((_, i) => <div key={i} className="mt-1"><Attachment m={m} index={i} /></div>)}
                  </>
                )}
                <div className={cn('mt-1 flex items-center gap-2 text-[10px]', mine ? 'text-white/70' : 'text-[var(--color-text-muted)]')}>
                  <span>{formatDateTime(m.createdAt)}{m.isEdited && !m.isDeleted ? ' · edited' : ''}</span>
                  {mine && (m.readAt ? <CheckCheck size={12} aria-label="Read" /> : <Check size={12} aria-label="Sent" />)}
                  {!m.isDeleted && (
                    <span className="ml-auto hidden gap-1.5 group-hover:flex group-focus-within:flex">
                      {mine && m.messageType === 'TEXT' && <button aria-label="Edit message" onClick={() => { setEditing(m); setText(m.content) }}><Pencil size={11} /></button>}
                      {mine && <button aria-label="Delete message" onClick={() => setDeleting(m)}><Trash2 size={11} /></button>}
                      {!mine && <button aria-label="Report message" onClick={() => setReporting(m)}><Flag size={11} /></button>}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {typing && <p className="text-xs italic text-[var(--color-text-muted)]">typing…</p>}
        <div ref={endRef} />
      </div>

      {disabled ? <Notice tone="info" className="m-3">{disabledReason ?? 'Chat is closed for this swap.'}</Notice> : (
        <form onSubmit={submit} className="border-t border-[var(--color-border)] p-3">
          {editing && <p className="mb-2 text-xs text-[var(--color-text-secondary)]">Editing message · <button type="button" className="underline" onClick={() => { setEditing(null); setText('') }}>cancel</button></p>}
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = '' }} />
            <Button type="button" variant="outline" size="icon-lg" aria-label="Attach image" disabled={upload.isPending} onClick={() => fileRef.current?.click()}><ImagePlus size={16} /></Button>
            <TextInput value={text} onChange={(e) => { setText(e.target.value); getSocket().emit('typing', { swapId, typing: true }) }} onBlur={() => getSocket().emit('typing', { swapId, typing: false })} placeholder="Write a message…" maxLength={2000} aria-label="Message" />
            <Button type="submit" size="icon-lg" aria-label="Send" disabled={!text.trim() || send.isPending}><Send size={16} /></Button>
          </div>
          <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">Never share card numbers or passwords. CashMouver will never ask you to send money.</p>
        </form>
      )}

      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} destructive title="Delete this message?" confirmLabel="Delete" onConfirm={async () => { await api.del(`/swaps/messages/${deleting!.id}`); done() }} />
      <ConfirmDialog open={!!reporting} onOpenChange={(o) => !o && setReporting(null)} title="Report this message" description="Our team will review it. The other member is not told who reported." reasonLabel="What is wrong with it?" confirmLabel="Send report"
        onConfirm={async (reason) => { await api.post(`/swaps/messages/${reporting!.id}/report`, { reason }); toast.success('Thanks — we will take a look') }} />
    </div>
  )
}

export type { PageMeta }
