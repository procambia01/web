'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/store/auth.store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  60_000,
      retry:      1,
      refetchOnWindowFocus: false,
    },
  },
})

function AuthInit() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [init])
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
        <AuthInit />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
            },
          }}
        />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
