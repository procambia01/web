'use client'
import { useState } from 'react'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, errorMessage } from '@/lib/api'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, TextArea } from '@/components/ui/field'
import { cn } from '@/lib/utils'

function Stars({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(n)} className="p-0.5">
            <Star size={22} className={cn(n <= value ? 'fill-amber-400 text-amber-400' : 'text-[var(--color-border)]')} />
          </button>
        ))}
      </div>
    </div>
  )
}

export function RatingDialog({ swapId, open, onOpenChange, onDone }: { swapId: string; open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [v, setV] = useState({ stars: 5, punctuality: 5, communication: 5, professionalism: 5, safety: 5 })
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit() {
    setBusy(true)
    try {
      await api.post(`/swaps/${swapId}/rating`, { ...v, comment: comment.trim() || undefined })
      toast.success('Thanks for rating')
      onDone()
      onOpenChange(false)
    } catch (e) { toast.error(errorMessage(e)) } finally { setBusy(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Rate this swap</DialogTitle><DialogDescription>Honest ratings keep the marketplace safe. The other member can&apos;t see yours until they&apos;ve rated you too.</DialogDescription></DialogHeader>
        <div className="space-y-2">
          <Stars label="Overall" value={v.stars} onChange={(n) => setV((p) => ({ ...p, stars: n }))} />
          <Stars label="Punctuality" value={v.punctuality} onChange={(n) => setV((p) => ({ ...p, punctuality: n }))} />
          <Stars label="Communication" value={v.communication} onChange={(n) => setV((p) => ({ ...p, communication: n }))} />
          <Stars label="Professionalism" value={v.professionalism} onChange={(n) => setV((p) => ({ ...p, professionalism: n }))} />
          <Stars label="Felt safe" value={v.safety} onChange={(n) => setV((p) => ({ ...p, safety: n }))} />
        </div>
        <Field label="Comment (optional)"><TextArea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} /></Field>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Later</Button><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Submit rating'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
