import Link from 'next/link'
import { Wordmark } from '@/components/layout/Logo'
import { buttonVariants } from '@/components/ui/button'
import { APP_NAME } from '@/lib/constants'

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label={`${APP_NAME} home`}><Wordmark /></Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-[var(--color-text-secondary)] md:flex" aria-label="Primary">
          <Link href="/how-it-works" className="hover:text-[var(--color-text-primary)]">How it works</Link>
          <Link href="/safety" className="hover:text-[var(--color-text-primary)]">Safety</Link>
          <Link href="/pricing" className="hover:text-[var(--color-text-primary)]">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>Sign in</Link>
          <Link href="/register" className={buttonVariants({ size: 'lg' })}>Get started</Link>
        </div>
      </div>
    </header>
  )
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Wordmark />
          <p className="mt-3 max-w-sm text-sm text-[var(--color-text-secondary)]">
            CashMouver connects people who want to exchange cash currencies in person. We are a marketplace, not a bank or an exchange: we never hold, escrow, move or refund the money you swap.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-[var(--color-text-primary)]">Product</p>
          <Link href="/how-it-works" className="block text-[var(--color-text-secondary)] hover:underline">How it works</Link>
          <Link href="/pricing" className="block text-[var(--color-text-secondary)] hover:underline">Pricing</Link>
          <Link href="/safety" className="block text-[var(--color-text-secondary)] hover:underline">Safety</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-[var(--color-text-primary)]">Legal</p>
          <Link href="/terms" className="block text-[var(--color-text-secondary)] hover:underline">Terms</Link>
          <Link href="/privacy" className="block text-[var(--color-text-secondary)] hover:underline">Privacy</Link>
        </div>
      </div>
      <p className="border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">© {new Date().getFullYear()} {APP_NAME} · cashmouver.com</p>
    </footer>
  )
}
