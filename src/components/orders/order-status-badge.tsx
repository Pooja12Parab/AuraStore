import { cn } from '@/lib/utils'

const TONE: Record<
  'pending' | 'paid' | 'failed' | 'refunded',
  { dot: string; pill: string; label: string }
> = {
  pending: {
    dot: 'bg-warning',
    pill: 'bg-warning/10 text-warning ring-warning/30',
    label: 'Pending',
  },
  paid: {
    dot: 'bg-success',
    pill: 'bg-success/10 text-success ring-success/30',
    label: 'Paid',
  },
  failed: {
    dot: 'bg-destructive',
    pill: 'bg-destructive/10 text-destructive ring-destructive/30',
    label: 'Failed',
  },
  refunded: {
    dot: 'bg-muted-foreground',
    pill: 'bg-muted text-muted-foreground ring-border',
    label: 'Refunded',
  },
}

type Props = {
  status: 'pending' | 'paid' | 'failed' | 'refunded' | string
  size?: 'sm' | 'md'
  className?: string
}

export function OrderStatusBadge({ status, size = 'md', className }: Props) {
  const tone = TONE[status as keyof typeof TONE] ?? {
    dot: 'bg-muted-foreground',
    pill: 'bg-muted text-muted-foreground ring-border',
    label: status,
  }
  return (
    <span
      data-testid={`order-row-status-${tone.label.toLowerCase()}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        tone.pill,
        className,
      )}
    >
      <span
        className={cn(
          'inline-block h-1.5 w-1.5 rounded-full',
          tone.dot,
        )}
        aria-hidden
      />
      {tone.label}
    </span>
  )
}
