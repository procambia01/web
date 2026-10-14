import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftRight, BadgeCheck, EyeOff, HandCoins, MapPin, MessageSquare, Search, ShieldCheck } from 'lucide-react'
import { COOKIE_REFRESH_TOKEN } from '@/lib/constants'
import { buttonVariants } from '@/components/ui/button'
import { LiveCurrencies } from '@/components/marketing/LiveCurrencies'

const STEPS = [
  { icon: Search, title: 'Find or post an offer', text: 'Browse people near you who have the currency you need, or list your own with the rate you want.' },
  { icon: MessageSquare, title: 'Agree the details', text: 'Chat inside CashMouver, settle the amount and rate, and propose a public place and time.' },
  { icon: HandCoins, title: 'Meet and swap', text: 'Exchange cash face to face. Both confirm in the app, then rate each other.' },
]

const PROMISES = [
  { icon: ShieldCheck, title: 'Non-custodial by design', text: 'We never hold, escrow or transfer your money. The exchange is between you and the other member.' },
  { icon: EyeOff, title: 'Your location stays coarse', text: 'Others see a trading area, not your position. Exact meeting details are shared only after you both agree.' },
  { icon: BadgeCheck, title: 'Trust you can check', text: 'Identity verification, ratings, completion rates and dispute history are visible before you commit.' },
  { icon: MapPin, title: 'Built for Europe and beyond', text: 'Dozens of currencies across Europe, the Americas, Asia and Africa — managed by us, not hardcoded.' },
]

export default async function HomePage() {
  const jar = await cookies()
  if (jar.has(COOKIE_REFRESH_TOKEN)) redirect('/dashboard')
  return (
    <>
      <section className="relative overflow-hidden bg-[var(--color-sidebar-bg)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-slate-300"><ArrowLeftRight size={12} /> Peer-to-peer cash currency exchange</p>
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.1] text-balance sm:text-6xl">Swap cash currencies with people near you.</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">Heading to London, back from Zurich, or holding leftover kroner? Find a member who needs what you have, agree a fair rate, and meet safely. No swap fees, and we never touch your money.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/register" className={buttonVariants({ size: 'lg', className: 'h-11 px-6 text-base' })}>Create a free account</Link>
            <Link href="/how-it-works" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'h-11 border-white/20 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white' })}>How it works</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl font-bold">Three steps, no middleman</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)]"><Icon size={20} /></span>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Step {i + 1}</p>
              <h3 className="mt-1 text-lg">{title}</h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-surface)] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl font-bold">Designed around trust and privacy</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {PROMISES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent-dark)]"><Icon size={18} /></span>
                <div><h3 className="text-base">{title}</h3><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LiveCurrencies />

      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="font-display text-3xl font-bold">Ready for your first swap?</h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--color-text-secondary)]">Joining is free. Upgrade only if you want extras like boosted visibility, rate alerts or higher limits.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/register" className={buttonVariants({ size: 'lg', className: 'h-11 px-6 text-base' })}>Get started</Link>
          <Link href="/pricing" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'h-11 px-6 text-base' })}>See pricing</Link>
        </div>
      </section>
    </>
  )
}
