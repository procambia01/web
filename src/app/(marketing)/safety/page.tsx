import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Safety', description: 'Practical safety guidance for meeting someone to exchange cash through CashMouver.' }

const TIPS = [
  ['Meet in public', 'Choose a busy, well-lit place such as a bank lobby, station concourse or hotel reception, during daytime where you can.'],
  ['Check trust signals', 'Look at verification, ratings, completed swaps and dispute history before agreeing to meet.'],
  ['Keep talking in the app', 'Keep your conversation in CashMouver chat so there is a record if you need to report a problem.'],
  ['Count and inspect together', 'Count the cash in front of each other and inspect notes before you hand anything over. Do not rush.'],
  ['Bring a friend if unsure', 'It is fine to bring someone, and fine to walk away. Cancel the swap if anything feels wrong.'],
  ['Never pay CashMouver for a swap', 'We do not take payment for exchanges and will never ask you to send money to us or a third party to “release” a swap.'],
  ['Report problems', 'Use Report or Open dispute on the swap. Our team reviews evidence and can restrict accounts. We do not recover exchanged cash.'],
]

export default function Safety() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold">Staying safe</h1>
      <p className="mt-3 text-[var(--color-text-secondary)]">Meeting a stranger with cash deserves care. These habits make swaps safer.</p>
      <dl className="mt-8 space-y-6">
        {TIPS.map(([t, d]) => (
          <div key={t}><dt className="font-display text-lg font-bold">{t}</dt><dd className="mt-1 text-sm text-[var(--color-text-secondary)]">{d}</dd></div>
        ))}
      </dl>
    </div>
  )
}
