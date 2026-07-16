import { formatINR } from '@/lib/utils'

interface PriceDisplayProps {
  price: number
  comparePrice?: number
}

export function PriceDisplay({ price, comparePrice }: PriceDisplayProps) {
  return (
    <div className="mt-1 flex items-center gap-2">
      <span className="text-lg font-semibold">{formatINR(price)}</span>
      {comparePrice && comparePrice > price && (
        <span className="text-sm text-gray-500 line-through">{formatINR(comparePrice)}</span>
      )}
    </div>
  )
}