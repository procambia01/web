import { ArrowLeftRight } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
      <ArrowLeftRight size={size * 0.55} strokeWidth={2.6} />
    </span>
  )
}

export function Wordmark({ light }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-display text-lg font-bold ${light ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>{APP_NAME}</span>
    </span>
  )
}
