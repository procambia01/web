import Link from 'next/link'
import { ShieldCheck, Handshake, MapPin } from 'lucide-react'
import { Wordmark } from '@/components/layout/Logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-[var(--color-sidebar-bg)] p-12 text-white lg:flex">
        <Link href="/"><Wordmark light /></Link>
        <div className="space-y-8">
          <h2 className="font-display text-4xl font-bold leading-tight text-balance">Exchange cash currencies in person, on your terms.</h2>
          <ul className="space-y-4 text-slate-300">
            <li className="flex gap-3"><Handshake className="mt-0.5 shrink-0 text-[var(--color-accent)]" size={20} /> Agree a rate directly with another member — no swap fee.</li>
            <li className="flex gap-3"><MapPin className="mt-0.5 shrink-0 text-[var(--color-accent)]" size={20} /> Meet in a public place you both choose. Exact spots stay private until you agree.</li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[var(--color-accent)]" size={20} /> We never hold, move or refund the money you exchange.</li>
          </ul>
        </div>
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} CashMouver · cashmouver.com</p>
      </div>
      <div className="flex items-center justify-center bg-[var(--color-bg)] p-6">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 block lg:hidden"><Wordmark /></Link>
          {children}
        </div>
      </div>
    </div>
  )
}
