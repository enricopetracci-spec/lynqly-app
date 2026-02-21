'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Briefcase, TrendingUp, Share2, Copy, Check } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todayBookings: 0,
    weekBookings: 0,
    totalClients: 0,
    activeServices: 0,
  })
  const [businessSlug, setBusinessSlug] = useState('')
  const [copied, setCopied] = useState(false)
  const [recentBookings, setRecentBookings] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Get business
    const { data: business } = await supabase
      .from('businesses')
      .select('id, slug')
      .eq('user_id', session.user.id)
      .single()

    if (!business) return

    setBusinessSlug(business.slug)

    // Get stats
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Today's bookings
    const { count: todayCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .eq('booking_date', today)

    // Week's bookings
    const { count: weekCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('booking_date', weekAgo)

    // Total clients
    const { count: clientsCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)

    // Active services
    const { count: servicesCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .eq('is_active', true)

    setStats({
      todayBookings: todayCount || 0,
      weekBookings: weekCount || 0,
      totalClients: clientsCount || 0,
      activeServices: servicesCount || 0,
    })

    // Get recent bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(name, phone),
        service:services(name, price)
      `)
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(5)

    setRecentBookings(bookings || [])
  }

  const copyBookingLink = () => {
    const link = `${window.location.origin}/${businessSlug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const bookingLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/${businessSlug}`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Panoramica della tua attività</p>
      </div>

      {/* Booking Link Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Share2 className="w-5 h-5" />
            <span>Il tuo link prenotazioni</span>
          </CardTitle>
          <CardDescription className="text-blue-100">
            Condividi questo link con i tuoi clienti per ricevere prenotazioni
          </CardDescription>
        </CardHeader>
        <CardContent>
         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 bg-white/20 rounded-lg px-4 py-3 text-white font-mono text-xs sm:text-sm break-all">
              {bookingLink}
            </div>
            <Button 
              variant="secondary" 
              onClick={copyBookingLink}
              className="flex items-center space-x-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiato!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copia</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oggi</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">
              Prenotazioni di oggi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questa settimana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekBookings}</div>
            <p className="text-xs text-muted-foreground">
              Prenotazioni ultimi 7 giorni
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clienti</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Totale clienti registrati
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servizi</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeServices}</div>
            <p className="text-xs text-muted-foreground">
              Servizi attivi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/services">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">Aggiungi Servizio</CardTitle>
              <CardDescription>
                Crea un nuovo servizio da offrire
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/staff">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">Gestisci Staff</CardTitle>
              <CardDescription>
                Configura il tuo team di lavoro
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">Impostazioni</CardTitle>
              <CardDescription>
                Configura orari e disponibilità
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Prenotazioni Recenti</CardTitle>
          <CardDescription>
            Le ultime 5 prenotazioni ricevute
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nessuna prenotazione ancora</p>
              <p className="text-sm mt-2">Le prenotazioni appariranno qui</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{booking.customer?.name}</p>
                    <p className="text-sm text-gray-600">
                      {booking.service?.name} • {booking.booking_date} {booking.booking_time}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {booking.status === 'confirmed' ? 'Confermata' :
                     booking.status === 'pending' ? 'In attesa' :
                     booking.status}
                  </div>
                </div>
              ))}
            </div>
          )}
          {recentBookings.length > 0 && (
            <div className="mt-4 text-center">
              <Link href="/dashboard/bookings">
                <Button variant="outline">Vedi tutte le prenotazioni</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
