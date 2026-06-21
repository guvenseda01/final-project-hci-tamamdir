import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** Backend stores paths like /uploads/avatars/x.jpg — prefix API origin for <img src>. */
export function resolveMediaUrl(url) {
  if (!url) return null
  if (/^(https?:|blob:|data:)/.test(url)) return url
  if (url.startsWith('/')) return `${API_BASE}${url}`
  return `${API_BASE}/${url}`
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

export const LOCATION_OPTIONS = [
  { value: 'on_campus', label: 'On campus' },
  { value: 'near_campus', label: 'Near campus' },
  { value: 'remote', label: 'Remote / online' },
]

const LOCATION_LABELS = Object.fromEntries(
  LOCATION_OPTIONS.map(o => [o.value, o.label])
)

export function formatLocationType(type) {
  return LOCATION_LABELS[type] ?? 'On campus'
}
