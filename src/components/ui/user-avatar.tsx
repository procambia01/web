import Image from 'next/image'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/format'

const COLORS = [
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-violet-500 to-violet-600',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
  'from-cyan-500 to-teal-500',
]

const SIZE = {
  xs:  'w-6 h-6 text-[10px]',
  sm:  'w-8 h-8 text-xs',
  md:  'w-9 h-9 text-sm',
  lg:  'w-11 h-11 text-base',
  xl:  'w-14 h-14 text-lg',
  '2xl': 'w-20 h-20 text-2xl',
}

interface UserAvatarProps {
  name:      string
  image?:    string | null
  size?:     keyof typeof SIZE
  className?: string
  verified?: boolean
}

export function UserAvatar({ name, image, size = 'md', className, verified }: UserAvatarProps) {
  const colorIdx = name.charCodeAt(0) % COLORS.length
  const grad     = COLORS[colorIdx]

  return (
    <div className={cn('relative shrink-0', className)}>
      <div className={cn(
        'rounded-full flex items-center justify-center font-bold font-body overflow-hidden',
        SIZE[size],
        !image && `bg-gradient-to-br ${grad} text-white`,
      )}>
        {image ? (
          <Image src={image} alt={name} fill className="object-cover" sizes="80px" />
        ) : (
          initials(name)
        )}
      </div>
      {verified && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-surface)] flex items-center justify-center">
          <svg viewBox="0 0 10 10" className="w-2 h-2 fill-white"><path d="M3.5 7 1.5 5l.7-.7 1.3 1.3 3-3 .7.7z"/></svg>
        </span>
      )}
    </div>
  )
}
