'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, TextArea } from '@/components/ui/field'
import { errorMessage } from '@/lib/api'

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', destructive, reasonLabel, reasonMin = 3, onConfirm }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
  /** When set, the dialog collects a reason and passes it to onConfirm. */
  reasonLabel?: string
  reasonMin?: number
  onConfirm: (reason: string) => Promise<unknown>
}) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const needsReason = reasonLabel !== undefined
  const invalid = needsReason && reason.trim().length < reasonMin

  async function run() {
    setBusy(true)
    try {
      await onConfirm(reason.trim())
      setReason('')
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {needsReason && (
          <Field label={reasonLabel} hint={`At least ${reasonMin} characters`}>
            <TextArea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </Field>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={run} disabled={busy || invalid}>{busy ? 'Working…' : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
