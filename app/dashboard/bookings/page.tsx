'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react'

type Booking = {
  id: string
  booking_date: string
  booking_time: string
  status: string
  notes: string
  customer: {
    name: string
    phone: string
  }
  service: {
    name: string
    price: number
  } | null
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!business) return

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        status,
        notes,
        customer:customers(name, phone),
        service:services(name, price)
      `)
      .eq('business_id', business.id)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false })

    if (bookingsData) {
      setBookings(bookingsData as any)
    }

    setLoading(false)
  }

  const updateStatus = async (bookingId: string, newStatus: string) => {
    await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)
    
    loadBookings()
  }

  const getFilteredBookings = () => {
    if (filter === 'all') return bookings
    return bookings.filter(b => b.status === filter)
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      no_show: 'bg-gray-100 text-gray-800 border-gray-300'
    }

    const labels = {
      pending: 'In Attesa',
      confirmed: 'Confermata',
      completed: 'Completata',
      cancelled: 'Cancellata',
      no_show: 'No Show'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'confirmed': return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-600" />
      default: return <Eye className="w-5 h-5 text-gray-600" />
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    })
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length
  }

  const filteredBookings = getFilteredBookings()

  if (loading) {
    return <div className="p-8">Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prenotazioni</h1>
        <p className="text-gray-600">Gestisci le prenotazioni dei clienti</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Totali</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">In Attesa</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <div className="text-sm text-gray-600">Confermate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completate</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Tutte</Button>
        <Button variant={filter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('pending')}>In Attesa ({stats.pending})</Button>
        <Button variant={filter === 'confirmed' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('confirmed')}>Confermate ({stats.confirmed})</Button>
        <Button variant={filter === 'completed' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('completed')}>Completate ({stats.completed})</Button>
      </div>

      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nessuna prenotazione</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map(booking => (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">{getStatusIcon(booking.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-semibold text-lg">{booking.customer?.name || 'Cliente'}</div>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{formatDate(booking.booking_date)}</div>
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{booking.booking_time}</div>
                        <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{booking.customer?.phone || '-'}</div>
                      </div>
                      {booking.service && <div className="mt-2 text-sm"><span className="font-medium">Servizio:</span> {booking.service.name} - €{booking.service.price}</div>}
                      {booking.notes && <div className="mt-2 text-sm text-gray-600 italic">"{booking.notes}"</div>}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {booking.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(booking.id, 'confirmed')}>Conferma</Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(booking.id, 'cancelled')}>Annulla</Button>
                      </>
                    )}
                    {booking.status === 'confirmed' && <Button size="sm" variant="outline" onClick={() => updateStatus(booking.id, 'completed')}>Completa</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
