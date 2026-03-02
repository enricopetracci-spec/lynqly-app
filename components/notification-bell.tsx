'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, X, Calendar, FileText } from 'lucide-react'

type Notification = {
  id: string
  type: 'booking' | 'quote'
  title: string
  message: string
  created_at: string
  read: boolean
  link?: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!business) return

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Load bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, booking_date, booking_time, created_at, customer_id')
      .eq('business_id', business.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    // Load quotes
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, quote_number, status, created_at, customer_id')
      .eq('business_id', business.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .in('status', ['accepted', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(10)

    const notifs: Notification[] = []

    // Load customer names for bookings
    if (bookings && bookings.length > 0) {
      for (const booking of bookings) {
        let customerName = 'Cliente'
        if (booking.customer_id) {
          const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', booking.customer_id)
            .single()
          if (customer) customerName = customer.name
        }

        notifs.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          title: '📅 Nuova Prenotazione',
          message: `${customerName} - ${new Date(booking.booking_date).toLocaleDateString('it-IT')} ${booking.booking_time}`,
          created_at: booking.created_at,
          read: isNotificationRead(`booking-${booking.id}`),
          link: '/dashboard/bookings'
        })
      }
    }

    // Load customer names for quotes
    if (quotes && quotes.length > 0) {
      for (const quote of quotes) {
        let customerName = 'Cliente'
        if (quote.customer_id) {
          const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', quote.customer_id)
            .single()
          if (customer) customerName = customer.name
        }

        const statusText = quote.status === 'accepted' ? '✅ Accettato' : '❌ Rifiutato'
        notifs.push({
          id: `quote-${quote.id}`,
          type: 'quote',
          title: `Preventivo ${statusText}`,
          message: `${quote.quote_number} - ${customerName}`,
          created_at: quote.created_at,
          read: isNotificationRead(`quote-${quote.id}`),
          link: '/dashboard/quotes'
        })
      }
    }

    notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setNotifications(notifs)
    setUnreadCount(notifs.filter(n => !n.read).length)
  }

  const isNotificationRead = (id: string) => {
    if (typeof window === 'undefined') return false
    const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '[]')
    return readNotifs.includes(id)
  }

  const markAsRead = (id: string) => {
    if (typeof window === 'undefined') return
    const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '[]')
    if (!readNotifs.includes(id)) {
      readNotifs.push(id)
      localStorage.setItem('readNotifications', JSON.stringify(readNotifs))
    }
    setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    if (typeof window === 'undefined') return
    const allIds = notifications.map(n => n.id)
    localStorage.setItem('readNotifications', JSON.stringify(allIds))
    setNotifications(prev => prev.map(n => ({...n, read: true})))
    setUnreadCount(0)
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'booking': return <Calendar className="w-5 h-5 text-blue-600" />
      case 'quote': return <FileText className="w-5 h-5 text-green-600" />
      default: return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPanel(false)}
          />
          <div className="fixed lg:absolute right-4 lg:left-full lg:ml-4 top-16 lg:top-0 w-[calc(100vw-2rem)] lg:w-96 bg-white rounded-lg shadow-xl border z-50 max-h-[70vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-900">Notifiche</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Segna tutte lette
                  </button>
                )}
                <button onClick={() => setShowPanel(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nessuna notifica</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map(notif => (
                    <a
                      key={notif.id}
                      href={notif.link}
                      onClick={() => {
                        markAsRead(notif.id)
                        setShowPanel(false)
                      }}
                      className={`block p-4 hover:bg-gray-50 transition ${
                        !notif.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getIcon(notif.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-gray-900">
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notif.created_at).toLocaleString('it-IT')}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

