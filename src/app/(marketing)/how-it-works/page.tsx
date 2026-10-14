import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = { title: 'How it works', description: 'How CashMouver connects people to exchange cash currencies in person — without ever holding your money.' }

const FLOW = [
  ['Create an offer or find one', 'Say which currency you have, which you want, how much, your rate and the general area you can meet. Others only ever see a coarse trading area.'],
  ['Request a swap', 'When you request part or all of an offer, that amount is set aside on the listing so it cannot be promised twice. No money moves.'],
  ['Agree and plan', 'The offer owner accepts. You settle details in chat and propose a public meeting spot and time. The agreed amount and rate are locked in a record that later edits to the offer cannot change.'],
  ['Meet and exchange', 'Check in on arrival, count the cash together, and swap. CashMouver is not present and never holds funds.'],
  ['Confirm and rate', 'Both of you confirm in the app. The swap completes once, and you can rate each other. If something goes wrong, open a dispute and our team reviews the evidence.'],
]

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold">How CashMouver works</h1>
      <p className="mt-3 text-[var(--color-text-secondary)]">CashMouver is a marketplace that introduces people. The exchange itself happens directly between you and another member.</p>
      <ol className="mt-10 space-y-6">
        {FLOW.map(([t, d], i) => (
          <li key={t} className="flex gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">{i + 1}</span>
            <div><h2 className="text-lg">{t}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{d}</p></div>
          </li>
        ))}
      </ol>
      <div className="mt-10 rounded-2xl bg-[var(--color-primary-light)] p-6">
        <h2 className="text-lg">What CashMouver does not do</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">We do not hold deposits, run an escrow, keep a wallet or balance for you, move money between members, or refund exchanged currency. Payments to CashMouver are only for optional services such as plans, boosts and verification.</p>
      </div>
      <Link href="/register" className={buttonVariants({ size: 'lg', className: 'mt-8 h-10 px-6' })}>Create a free account</Link>
    </div>
  )
}
