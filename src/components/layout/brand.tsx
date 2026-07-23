import { cn } from '@/lib/utils'

type Props = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'invert'
}

const SIZES: Record<NonNullable<Props['size']>, { icon: number; text: string; pad: string }> = {
  sm: { icon: 22, text: 'text-base', pad: 'px-2 py-1' },
  md: { icon: 28, text: 'text-lg', pad: 'px-2 py-1' },
  lg: { icon: 36, text: 'text-2xl', pad: 'px-2 py-1' },
}

export function Brand({ className, size = 'md', variant = 'default' }: Props) {
  const s = SIZES[size]
  const isInvert = variant === 'invert'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-semibold tracking-tight',
        s.text,
        s.pad,
        isInvert ? 'text-white' : 'text-foreground',
        className,
      )}
      data-testid="brand"
    >
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0"
      >
        <defs>
          <linearGradient id="aurastore-brand" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="oklch(0.58 0.18 280)" />
            <stop offset="1" stopColor="oklch(0.42 0.18 320)" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#aurastore-brand)" />
        <path
          d="M11 24 L20 11 L29 24 M15 24 H25"
          fill="none"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="29" r="1.6" fill="white" />
      </svg>
      <span className="leading-none">
        Aura<span className="text-brand-600">Store</span>
      </span>
    </span>
  )
}
