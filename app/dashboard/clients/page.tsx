'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Phone, Mail, Calendar, Search, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Customer = {
  id: string
  name: string
  phone: string
  email: string | null
  notes: string | null
  created_at: string
  bookings: {
    id: string
    booking_date: string
    status: string
  }[]
}

export default function ClientsPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [customers, searchQuery])

  const loadCustomers = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!business) return

    const { data } = await supabase
      .from('customers')
      .select(`
        *,
        bookings(id, booking_date, status)
      `)
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })

    if (data) {
      setCustomers(data as Customer[])
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...customers]

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredCustomers(filtered)
  }

  const getCustomerStats = (customer: Customer) => {
    const totalBookings = customer.bookings.length
    const completedBookings = customer.bookings.filter(b => b.status === 'completed').length
    const lastBooking = customer.bookings.length > 0
      ? customer.bookings.sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())[0]
      : null

    return { totalBookings, completedBookings, lastBooking }
  }

  if (loading) {
    return <div>Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clienti</h1>
        <p className="text-gray-600 mt-1">Gestisci i tuoi clienti e visualizza lo storico</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Totale Clienti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Nuovi questo mese</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customers.filter(c => {
                const created = new Date(c.created_at)
                const monthAgo = new Date()
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                return created > monthAgo
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Clienti Attivi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {customers.filter(c => c.bookings.some(b => b.status === 'confirmed' || b.status === 'pending')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Cerca per nome, telefono o email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun cliente trovato</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Prova a cercare con altri termini' : 'I clienti appariranno qui quando riceverai prenotazioni'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCustomers.map((customer) => {
            const stats = getCustomerStats(customer)
            return (
              <Card key={customer.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                          <p className="text-sm text-gray-500">Cliente dal {formatDate(customer.created_at)}</p>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                      </div>

                      {customer.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                          <strong>Note:</strong> {customer.notes}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <TrendingUp className="w-4 h-4" />
                          <span>{stats.totalBookings} prenotazioni</span>
                        </div>
                        {stats.lastBooking && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs">Ultima: {formatDate(stats.lastBooking.booking_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Customer Detail Modal (Simple version) */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCustomer(null)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {selectedCustomer.name}
              </CardTitle>
              <CardDescription>Dettagli cliente e storico prenotazioni</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Contatti</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedCustomer.notes && (
                <div>
                  <h4 className="font-medium mb-2">Note</h4>
                  <p className="text-sm text-gray-600">{selectedCustomer.notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Storico Prenotazioni ({selectedCustomer.bookings.length})</h4>
                <div className="space-y-2">
                  {selectedCustomer.bookings.length === 0 ? (
                    <p className="text-sm text-gray-500">Nessuna prenotazione</p>
                  ) : (
                    selectedCustomer.bookings
                      .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())
                      .slice(0, 5)
                      .map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <span>{formatDate(booking.booking_date)}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                  Chiudi
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
