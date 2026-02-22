import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

export function formatTime(timeString: string): string {
  return timeString.substring(0, 5)
}

export function getBookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    no_show: 'bg-gray-100 text-gray-800 border-gray-200'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getBookingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'In attesa',
    confirmed: 'Confermata',
    cancelled: 'Cancellata',
    completed: 'Completata',
    no_show: 'Non presentato'
  }
  return labels[status] || status
}
