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

export function formatPrice(price: number): string {
  return `€${price.toFixed(2)}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}min`
}

export function generateTimeSlots(startHour: number = 9, endHour: number = 19, intervalMinutes: number = 30): string[] {
  const slots: string[] = []
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(timeString)
    }
  }
  
  return slots
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
