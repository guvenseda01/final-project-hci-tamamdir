import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const UNIT_LABEL = {
  hour:    '/hr',
  session: '/session',
  day:     '/day',
  item:    '/item',
  piece:   '/piece',
}

export function formatPrice(price, unit) {
  const label = UNIT_LABEL[unit] ?? ''
  return `₺${price}${label}`
}

export function formatDelivery(days) {
  return days === 1 ? 'Delivery within 1 day' : `Delivery within ${days} days`
}
