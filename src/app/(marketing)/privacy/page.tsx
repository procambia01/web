import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy' }

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold">Privacy</h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">Summary — the full policy is provided by the CashMouver operator before launch.</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        <p>Other members see a coarse trading area, never your exact coordinates. Exact meeting details are shared only with the other participant of an agreed swap.</p>
        <p>Identity documents are stored privately, viewed only by authorised reviewers through short-lived links, and deleted according to our retention rules. We do not log passwords, one-time codes, card data or document contents.</p>
        <p>Card payments are handled by Stripe; CashMouver never sees your card number.</p>
      </div>
    </div>
  )
}
