'use client'
import { use } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import type { PublicUserDto } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { countryName } from '@/lib/countries'
import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState, PageLoader } from '@/components/ui/states'
import { UserAvatar } from '@/components/ui/user-avatar'
import { TrustBadges } from '@/components/shared/TrustBadges'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

type Profile = PublicUserDto & { bio: string | null; activeOffers: number; isFavorite: boolean }

export default function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const [blockOpen, setBlockOpen] = useState(false)
  const q = useQuery({ queryKey: ['member', id], queryFn: () => api.get<Profile>(`/users/${id}/public`) })
  const fav = useMutation({
    mutationFn: (on: boolean) => (on ? api.post(`/users/me/favorites/${id}`, {}) : api.del(`/users/me/favorites/${id}`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['member', id] }),
    onError: (e) => toast.error(errorMessage(e)),
  })
  if (q.isLoading) return <PageLoader />
  if (q.error || !q.data) return <ErrorState error={q.error} />
  const u = q.data
  const self = me?.id === u.id
  return (
    <div className="max-w-2xl">
      <Card>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <UserAvatar name={u.name} image={u.image} size="2xl" verified={u.verified} />
            <div><h1 className="text-2xl">{u.name}</h1><p className="text-sm text-[var(--color-text-muted)]">{[u.city, u.country && countryName(u.country)].filter(Boolean).join(', ')} · member since {formatDate(u.memberSince)}</p><div className="mt-2"><TrustBadges user={u} /></div></div>
          </div>
          {u.bio && <p className="text-sm">{u.bio}</p>}
          <dl className="grid grid-cols-4 gap-3 text-center text-xs">
            {[['Trust', u.trustScore], ['Rating', u.totalSwaps ? u.rating.toFixed(1) : '—'], ['Completed', `${Math.round(u.completionRate * 100)}%`], ['Open offers', u.activeOffers]].map(([l, v]) => <div key={String(l)} className="rounded-xl bg-[var(--color-bg)] p-3"><dd className="font-display text-lg font-bold">{v}</dd><dt className="text-[var(--color-text-muted)]">{l}</dt></div>)}
          </dl>
          {!self && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fav.mutate(!u.isFavorite)} disabled={fav.isPending}><Heart size={14} className={u.isFavorite ? 'fill-red-500 text-red-500' : ''} /> {u.isFavorite ? 'Favourited' : 'Add to favourites'}</Button>
              <Button variant="ghost" onClick={() => setBlockOpen(true)}><Ban size={14} /> Block</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog open={blockOpen} onOpenChange={setBlockOpen} destructive title={`Block ${u.name}?`} description="You won't see each other's offers or be able to message. Existing swaps are unaffected." confirmLabel="Block" reasonLabel="Reason (optional, private)" reasonMin={0}
        onConfirm={async (reason) => { await api.post(`/users/me/blocked/${id}`, { reason: reason || undefined }); toast.success('Member blocked'); void qc.invalidateQueries({ queryKey: ['member', id] }) }} />
    </div>
  )
}
