import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { APP_NAME, APP_URL } from '@/lib/constants'

const DESCRIPTION =
  'CashMouver is a peer-to-peer marketplace for exchanging cash currencies in person across Europe and beyond. Find people near you, agree a rate, meet safely. We never hold your money.'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: `${APP_NAME} — Peer-to-peer cash currency exchange`, template: `%s | ${APP_NAME}` },
  description: DESCRIPTION,
  applicationName: APP_NAME,
  
  manifest: '/manifest.webmanifest',
  openGraph: { title: `${APP_NAME} — Peer-to-peer cash currency exchange`, description: DESCRIPTION, url: APP_URL, siteName: APP_NAME, locale: 'en_GB', type: 'website' },
  twitter: { card: 'summary_large_image', title: `${APP_NAME} — Peer-to-peer cash currency exchange`, description: DESCRIPTION },
}

export const viewport: Viewport = { themeColor: '#1A6BFF', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
