'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState, type ReactNode } from 'react'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { AUTH_LOST_EVENT, ApiError } from '@/lib/api'
import { ReauthDialog } from '@/components/shared/ReauthDialog'

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
      },
    },
  })
}

function AuthInit() {
  const init = useAuthStore((s) => s.init)
  const clear = useAuthStore((s) => s.clear)
  const router = useRouter()
  useEffect(() => {
    void init()
    const lost = () => {
      clear()
      router.replace('/login')
    }
    window.addEventListener(AUTH_LOST_EVENT, lost)
    return () => window.removeEventListener(AUTH_LOST_EVENT, lost)
  }, [init, clear, router])
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeClient)
  return (
    <NuqsAdapter>
      <QueryClientProvider client={client}>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <AuthInit />
          {children}
          <ReauthDialog />
          <Toaster position="top-right" toastOptions={{ duration: 4000, style: { fontSize: '14px', borderRadius: '12px' } }} />
        </ThemeProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
