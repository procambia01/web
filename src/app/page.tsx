import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_ACCESS_TOKEN } from '@/lib/constants'
import LandingPage from './(marketing)/page'

export default async function RootPage() {
  const jar   = await cookies()
  const token = jar.get(COOKIE_ACCESS_TOKEN)
  if (token) redirect('/dashboard')
  return <LandingPage />
}
