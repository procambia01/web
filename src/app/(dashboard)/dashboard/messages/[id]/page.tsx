'use client'
import { use } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import type { SwapDto } from '@/contracts'
import { api } from '@/lib/api'
import { ChatPanel } from '@/components/shared/ChatPanel'
import { ErrorState, PageLoader } from '@/components/ui/states'
import { SwapStatusBadge } from '@/components/ui/status-badge'

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const q = useQuery({ queryKey: ['swap', id], queryFn: () => api.get<SwapDto>(`/swaps/${id}`) })
  if (q.isLoading) return <PageLoader />
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const s = q.data
  const other = s.iAm === 'INITIATOR' ? s.receiver : s.initiator
  const closed = s.status === 'CANCELLED'
  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/messages" className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:underline"><ArrowLeft size={14} /> All messages</Link>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl">{other.name}</h1>
        <div className="flex items-center gap-3"><SwapStatusBadge status={s.status} /><Link className="text-sm text-[var(--color-primary)] hover:underline" href={`/dashboard/swaps/${s.id}`}>View swap</Link></div>
      </div>
      <ChatPanel swapId={id} disabled={closed} disabledReason="This swap was cancelled, so the chat is closed." />
    </div>
  )
}
