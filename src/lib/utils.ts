import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(value: number): string {
  if (value == null || isNaN(value)) return '₹0'
  const [major] = value.toFixed(2).split('.')
  const formatted = Number(major).toLocaleString('en-IN')
  return `₹${formatted}`
}
