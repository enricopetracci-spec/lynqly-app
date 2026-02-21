import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Genera uno slug URL-friendly da un nome
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Formatta il prezzo in euro
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

// Formatta la data in italiano
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

// Formatta l'ora
export function formatTime(time: string): string {
  return time.slice(0, 5) // "HH:MM:SS" -> "HH:MM"
}

// Formatta durata in minuti in formato leggibile
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

// Valida email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Valida telefono italiano
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Genera orari disponibili
export function generateTimeSlots(
  startTime: string, // "09:00"
  endTime: string,   // "18:00"
  slotDuration: number = 30 // minuti
): string[] {
  const slots: string[] = []
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  let currentMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60)
    const mins = currentMinutes % 60
    slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`)
    currentMinutes += slotDuration
  }
  
  return slots
}

// Ottieni il giorno della settimana (0-6, dove 0=Domenica)
export function getDayOfWeek(date: Date): number {
  return date.getDay()
}

// Aggiungi giorni a una data
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Verifica se una data è nel passato
export function isPastDate(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate < today
}

// Ottieni traduzione tipo di business
export function getBusinessTypeLabel(type: string): string {
  const types: Record<string, string> = {
    'salon': 'Salone di bellezza',
    'barber': 'Barbiere',
    'spa': 'Centro estetico',
    'nails': 'Centro unghie',
    'massage': 'Centro massaggi',
    'tattoo': 'Studio tatuaggi',
    'gym': 'Palestra',
    'other': 'Altro',
  }
  return types[type] || type
}

// Ottieni colore per stato prenotazione
export function getBookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'confirmed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800',
    'completed': 'bg-blue-100 text-blue-800',
    'no_show': 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// Ottieni label per stato prenotazione
export function getBookingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'pending': 'In attesa',
    'confirmed': 'Confermata',
    'cancelled': 'Cancellata',
    'completed': 'Completata',
    'no_show': 'Non presentato',
  }
  return labels[status] || status
}
