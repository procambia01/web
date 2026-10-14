'use client'
import { useState } from 'react'
import { api, ApiError, errorMessage } from '@/lib/api'
import { useReauthStore } from '@/store/reauth.store'
import { useAuthStore } from '@/store/auth.store'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'

/** Global "confirm it's you" prompt for sensitive actions (password change, API keys, billing portal…). */
export function ReauthDialog() {
  const { open, settle } = useReauthStore()
  const twoFactor = useAuthStore((s) => s.user?.twoFactorEnabled)
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/auth/reauth', { password, ...(twoFactor && code ? { twoFactorCode: code } : {}) })
      setPassword('')
      setCode('')
      settle(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && settle(false)}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Confirm it&apos;s you</DialogTitle>
            <DialogDescription>For your security, please re-enter your password to continue.</DialogDescription>
          </DialogHeader>
          <Field label="Password" error={error}>
            <TextInput type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
          </Field>
          {twoFactor && (
            <Field label="Authenticator code">
              <TextInput inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.trim())} placeholder="6-digit code" />
            </Field>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => settle(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !password}>{busy ? 'Checking…' : 'Continue'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
