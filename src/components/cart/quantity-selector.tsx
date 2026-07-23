'use client'

import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  quantity: number
  onChange: (next: number) => void
  min?: number
  max?: number
}

export function QuantitySelector({ quantity, onChange, min = 1, max = 99 }: Props) {
  const inc = () => onChange(Math.min(max, quantity + 1))
  const dec = () => onChange(Math.max(min, quantity - 1))
  return (
    <div
      role="group"
      aria-label="Quantity"
      data-testid="quantity-selector"
      className="inline-flex items-center rounded-md border border-border bg-background"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Decrease quantity"
        onClick={dec}
        disabled={quantity <= min}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </Button>
      <span
        aria-live="polite"
        data-testid="quantity-value"
        className="min-w-8 px-1 text-center text-sm font-medium tabular-nums"
      >
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Increase quantity"
        onClick={inc}
        disabled={quantity >= max}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </div>
  )
}
