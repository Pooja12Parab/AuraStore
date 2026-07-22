import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number): string {
  if (value == null || isNaN(value)) return '$0'
  // Prices are stored as integer cents (e.g. 1999 = $19.99); divide to get dollars.
  const major = value / 100
  return `$${major.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

