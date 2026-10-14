'use client'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Crosshair, MapPin, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { SUPPORTED_LOCALES, updateProfileSchema } from '@/contracts'
import { api, errorMessage } from '@/lib/api'
import { validate } from '@/lib/form'
import { countryOptions } from '@/lib/countries'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Field, NativeSelect, TextArea, TextInput } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Notice } from '@/components/ui/states'
import { useCurrencies } from '@/hooks/useCurrencies'

interface SavedLoc { id: string; name: string; address: string; city: string; country: string; isPrimary: boolean }
const LANGS: Record<string, string> = { en: 'English', fr: 'Français', de: 'Deutsch', es: 'Español', it: 'Italiano', pt: 'Português', nl: 'Nederlands' }

export default function ProfilePage() {
  const me = useAuthStore((s) => s.user)!
  const refresh = useAuthStore((s) => s.refreshUser)
  const qc = useQueryClient()
  const { currencies } = useCurrencies()
  const file = useRef<HTMLInputElement>(null)
  const [f, setF] = useState({ name: me.name, bio: '', country: me.country ?? '', city: me.city ?? '', languagePreference: me.languagePreference, timezone: me.timezone, preferredCurrencies: me.preferredCurrencies })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loc, setLoc] = useState({ city: me.city ?? '', country: me.country ?? '' })
  const [locBusy, setLocBusy] = useState(false)

  const saved = useQuery({ queryKey: ['saved-locations'], queryFn: () => api.get<SavedLoc[]>('/users/me/locations') })

  const save = useMutation({
    mutationFn: (b: unknown) => api.patch('/users/me', b),
    onSuccess: async () => { toast.success('Profile updated'); await refresh() },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const avatar = useMutation({
    mutationFn: (fd: FormData) => api.upload('/users/me/avatar', fd),
    onSuccess: async () => { toast.success('Photo updated'); await refresh() },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const delLoc = useMutation({
    mutationFn: (id: string) => api.del(`/users/me/locations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-locations'] }),
    onError: (e) => toast.error(errorMessage(e)),
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const { data, errors } = validate(updateProfileSchema, { ...f, bio: f.bio || undefined, country: f.country || undefined, city: f.city || undefined })
    setErrors(errors)
    if (data) save.mutate(data)
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return toast.error('Use a JPEG, PNG or WebP image')
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5 MB')
    const fd = new FormData(); fd.append('avatar', file); avatar.mutate(fd)
  }
  function useMyLocation() {
    if (!navigator.geolocation) return toast.error('Location is not available in this browser')
    if (!loc.city.trim() || loc.country.length !== 2) return toast.error('Enter your city and country first')
    setLocBusy(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.put('/users/me/location', { latitude: pos.coords.latitude, longitude: pos.coords.longitude, city: loc.city.trim(), country: loc.country })
          toast.success('Location updated'); await refresh()
        } catch (e) { toast.error(errorMessage(e)) } finally { setLocBusy(false) }
      },
      () => { setLocBusy(false); toast.error('Could not read your location. Check browser permissions.') },
      { enableHighAccuracy: false, timeout: 10_000 },
    )
  }
  const toggleCur = (c: string) => setF((x) => ({ ...x, preferredCurrencies: x.preferredCurrencies.includes(c) ? x.preferredCurrencies.filter((y) => y !== c) : [...x.preferredCurrencies, c].slice(0, 20) }))

  return (
    <div className="max-w-3xl">
      <PageHeader title="Profile" description="What other members see, and how CashMouver finds nearby matches." />
      <div className="mb-8 flex items-center gap-4">
        <UserAvatar name={me.name} image={me.image} size="lg" />
        <div><input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
          <Button variant="outline" size="sm" disabled={avatar.isPending} onClick={() => file.current?.click()}><Upload size={14} className="mr-1.5" />{avatar.isPending ? 'Uploading…' : 'Change photo'}</Button>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">JPEG, PNG or WebP, up to 5 MB.</p></div>
      </div>

      <form onSubmit={submit} className="mb-10 space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <Field label="Name" error={errors.name}><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} invalid={!!errors.name} /></Field>
        <Field label="About you" error={errors.bio} hint="Optional. Visible on your public profile."><TextArea value={f.bio} maxLength={500} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Country" error={errors.country}><NativeSelect value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}><option value="">Select…</option>{countryOptions().map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</NativeSelect></Field>
          <Field label="City" error={errors.city}><TextInput value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></Field>
          <Field label="Language"><NativeSelect value={f.languagePreference} onChange={(e) => setF({ ...f, languagePreference: e.target.value })}>{SUPPORTED_LOCALES.map((l) => <option key={l} value={l}>{LANGS[l]}</option>)}</NativeSelect></Field>
        </div>
        <fieldset><legend className="mb-1 text-sm font-medium">Currencies you usually trade</legend>
          <div className="flex flex-wrap gap-2">{currencies.map((c) => <button type="button" key={c.code} aria-pressed={f.preferredCurrencies.includes(c.code)} onClick={() => toggleCur(c.code)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${f.preferredCurrencies.includes(c.code) ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)]'}`}>{c.code}</button>)}</div></fieldset>
        <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save changes'}</Button>
      </form>

      <section className="mb-10">
        <h2 className="mb-2 text-lg">Your area</h2>
        <Notice tone="info" className="mb-3">Other members only ever see an approximate area. Exact meeting places are shared with your swap partner only after you both agree on a meetup.</Notice>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="City"><TextInput value={loc.city} onChange={(e) => setLoc({ ...loc, city: e.target.value })} /></Field>
          <Field label="Country"><NativeSelect value={loc.country} onChange={(e) => setLoc({ ...loc, country: e.target.value })}><option value="">Select…</option>{countryOptions().map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</NativeSelect></Field>
          <Button variant="outline" disabled={locBusy} onClick={useMyLocation}><Crosshair size={14} className="mr-1.5" />{locBusy ? 'Locating…' : 'Use my current location'}</Button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg">Saved meeting places</h2>
        <ul className="space-y-2">
          {(saved.data ?? []).map((l) => (
            <li key={l.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
              <span className="flex items-center gap-2"><MapPin size={14} />{l.name} — {l.address}, {l.city}{l.isPrimary && <span className="rounded bg-[var(--color-primary-light)] px-1.5 text-[10px] font-bold uppercase text-[var(--color-primary)]">Primary</span>}</span>
              <Button size="sm" variant="ghost" aria-label={`Delete ${l.name}`} onClick={() => delLoc.mutate(l.id)}><Trash2 size={14} /></Button>
            </li>
          ))}
          {!saved.isLoading && !saved.data?.length && <li className="text-sm text-[var(--color-text-secondary)]">None yet. You can save a place when you create an offer.</li>}
        </ul>
      </section>
    </div>
  )
}
