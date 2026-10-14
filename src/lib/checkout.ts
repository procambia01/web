import { api } from './api'
import type { CheckoutSessionDto } from '@/contracts'

type Kind = 'subscription' | 'boost' | 'featured' | 'verification' | 'advertising'

/**
 * Creates a server-side Stripe Checkout session and sends the browser to
 * Stripe. The price is looked up on the server from the product code — the
 * client never sends an amount. Success is confirmed by the server (webhook),
 * never by the return URL.
 */
export async function startCheckout(kind: Kind, body: Record<string, unknown>): Promise<void> {
  const s = await api.post<CheckoutSessionDto>(`/billing/checkout/${kind}`, body)
  if (!/^https:\/\/(checkout|billing)\.stripe\.com\//.test(s.url) && !s.url.startsWith(window.location.origin)) {
    throw new Error('Unexpected checkout address')
  }
  window.location.assign(s.url)
}
