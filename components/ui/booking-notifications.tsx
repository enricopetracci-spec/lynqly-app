'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast'
import { formatDate, formatTime } from '@/lib/utils'

export function BookingNotifications({ businessId }: { businessId: string }) {
  const { addToast } = useToast()

  useEffect(() => {
    // Subscribe to bookings changes
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `business_id=eq.${businessId}`,
        },
        async (payload) => {
          // New booking received!
          const booking = payload.new
          
          // Get customer and service details
          const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', booking.customer_id)
            .single()

          const { data: service } = await supabase
            .from('services')
            .select('name')
            .eq('id', booking.service_id)
            .single()

          // Play notification sound (optional)
          playNotificationSound()

          addToast({
            type: 'success',
            title: '🎉 Nuova Prenotazione!',
            description: `${customer?.name || 'Cliente'} - ${service?.name || 'Servizio'} - ${formatDate(booking.booking_date)} ${formatTime(booking.booking_time)}`,
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `business_id=eq.${businessId}`,
        },
        async (payload) => {
          // Booking updated
          const oldBooking = payload.old
          const newBooking = payload.new

          // Get customer name
          const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', newBooking.customer_id)
            .single()

          // Check what changed
          if (oldBooking.status !== newBooking.status) {
            let message = ''
            let type: 'info' | 'warning' | 'error' = 'info'

            if (newBooking.status === 'confirmed') {
              message = `Prenotazione di ${customer?.name} confermata`
              type = 'info'
            } else if (newBooking.status === 'cancelled') {
              message = `Prenotazione di ${customer?.name} cancellata`
              type = 'warning'
            } else if (newBooking.status === 'completed') {
              message = `Prenotazione di ${customer?.name} completata`
              type = 'info'
            }

            if (message) {
              addToast({
                type,
                title: 'Prenotazione Aggiornata',
                description: message,
              })
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookings',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          addToast({
            type: 'error',
            title: 'Prenotazione Eliminata',
            description: 'Una prenotazione è stata eliminata',
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId, addToast])

  return null
}

// Optional: Play notification sound
function playNotificationSound() {
  if (typeof window !== 'undefined') {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE')
    audio.volume = 0.3
    audio.play().catch(() => {}) // Ignore errors
  }
}
