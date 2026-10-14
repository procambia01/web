import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of use' }

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold">Terms of use</h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">Summary — the full terms are provided by the CashMouver operator before launch.</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        <p>CashMouver is an introduction marketplace. Members exchange cash currencies directly with each other. CashMouver is not a party to any exchange and does not hold, escrow, transfer, guarantee or refund exchanged currency.</p>
        <p>Fees are charged only for optional CashMouver services (plans, boosts, featured placement, verification, advertising and API access). Refunds, where available, apply to those service payments only.</p>
        <p>Members must follow the laws that apply to them, including any rules on currency exchange and anti-money-laundering where they live. Accounts that break these rules or the safety guidance may be restricted.</p>
      </div>
    </div>
  )
}
