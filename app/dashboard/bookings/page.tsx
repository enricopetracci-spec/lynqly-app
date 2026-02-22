'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, MessageSquare, Search } from 'lucide-react'
import { formatDate, formatTime, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils'

type Booking = {
  id: string
  booking_date: string
  booking_time: string
  status: string
  customer_notes: string | null
  internal_notes: string | null
  customer: {
    name: string
    phone: string
    email: string | null
  }
  service: {
    name: string
    duration_minutes: number
    price: number
  }
  staff: {
    name: string
  } | null
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, today, week, month
  const [searchQuery, setSearchQuery] = useState('')
  const [businessId, setBusinessId] = useState<string | null>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [bookings, filter, searchQuery])

  const loadBookings = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!business) return

    setBusinessId(business.id)

    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(name, phone, email),
        service:services(name, duration_minutes, price),
        staff:staff(name)
      `)
      .eq('business_id', business.id)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })

    if (data) {
      setBookings(data as Booking[])
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...bookings]

    // Filter by date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (filter === 'today') {
      const todayStr = today.toISOString().split('T')[0]
      filtered = filtered.filter(b => b.booking_date === todayStr)
    } else if (filter === 'week') {
      const weekFromNow = new Date(today)
      weekFromNow.setDate(weekFromNow.getDate() + 7)
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.booking_date)
        return bookingDate >= today && bookingDate <= weekFromNow
      })
    } else if (filter === 'month') {
      const monthFromNow = new Date(today)
      monthFromNow.setMonth(monthFromNow.getMonth() + 1)
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.booking_date)
        return bookingDate >= today && bookingDate <= monthFromNow
      })
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer.phone.includes(searchQuery)
      )
    }

    setFilteredBookings(filtered)
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)

    if (!error) {
      loadBookings()
    }
  }

  const getStats = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayBookings = bookings.filter(b => b.booking_date === today)
    const pending = bookings.filter(b => b.status === 'pending').length
    const confirmed = bookings.filter(b => b.status === 'confirmed').length

    return {
      today: todayBookings.length,
      pending,
      confirmed,
      total: bookings.length
    }
  }

  const stats = getStats()

  if (loading) {
    return <div>Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Prenotazioni</h1>
        <p className="text-gray-600 mt-1">Gestisci tutte le prenotazioni ricevute</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Oggi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In attesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Confermate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Tutte
          </Button>
          <Button
            variant={filter === 'today' ? 'default' : 'outline'}
            onClick={() => setFilter('today')}
            size="sm"
          >
            Oggi
          </Button>
          <Button
            variant={filter === 'week' ? 'default' : 'outline'}
            onClick={() => setFilter('week')}
            size="sm"
          >
            Settimana
          </Button>
          <Button
            variant={filter === 'month' ? 'default' : 'outline'}
            onClick={() => setFilter('month')}
            size="sm"
          >
            Mese
          </Button>
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cerca per nome o telefono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna prenotazione</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Non ci sono ancora prenotazioni'
                : `Nessuna prenotazione ${filter === 'today' ? 'oggi' : `questa ${filter === 'week' ? 'settimana' : 'mese'}`}`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Left: Booking Info */}
                  <div className="flex-1 space-y-3">
                    {/* Date & Time */}
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span>{formatDate(booking.booking_date)}</span>
                      <Clock className="w-5 h-5 text-blue-600 ml-2" />
                      <span>{formatTime(booking.booking_time)}</span>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{booking.customer.name}</span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span>{booking.customer.phone}</span>
                      </div>
                      {booking.customer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>{booking.customer.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Service */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-900">{booking.service.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Durata: {booking.service.duration_minutes} min • €{booking.service.price.toFixed(2)}
                      </div>
                    </div>

                    {/* Notes */}
                    {booking.customer_notes && (
                      <div className="flex gap-2 text-sm">
                        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 italic">{booking.customer_notes}</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getBookingStatusColor(booking.status)}`}>
                        {getBookingStatusLabel(booking.status)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  {booking.status === 'pending' && (
                    <div className="flex sm:flex-col gap-2">
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-initial"
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Conferma
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-initial"
                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rifiuta
                      </Button>
                    </div>
                  )}

                  {booking.status === 'confirmed' && (
                    <div className="flex sm:flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-initial"
                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                      >
                        Completata
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-initial"
                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                      >
                        Cancella
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
