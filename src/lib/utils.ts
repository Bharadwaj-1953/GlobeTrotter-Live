import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | null): string {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: string | null): string {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function getDaysBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getInitials(name: string | null): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getModeIcon(mode: string): string {
  switch (mode) {
    case 'flight': return '✈️'
    case 'train': return '🚄'
    case 'bus': return '🚌'
    case 'car': return '🚗'
    default: return '🚀'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'text-emerald-600 bg-emerald-50'
    case 'draft': return 'text-amber-600 bg-amber-50'
    case 'completed': return 'text-slate-600 bg-slate-100'
    case 'voting': return 'text-blue-600 bg-blue-50'
    case 'planning': return 'text-purple-600 bg-purple-50'
    case 'booked': return 'text-emerald-600 bg-emerald-50'
    default: return 'text-slate-600 bg-slate-100'
  }
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '…'
}

const TRIP_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&w=800&q=80',
]

export function getRandomTripImage(tripId?: string | null): string {
  if (!tripId) return TRIP_IMAGE_POOL[0]
  const hash = tripId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return TRIP_IMAGE_POOL[hash % TRIP_IMAGE_POOL.length]
}
