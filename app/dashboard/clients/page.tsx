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
  bookings: Array<{
    id: string
    booking_date: string
    booking_time: string
    status: string
    service: {
      name: string
      price: number
    }
  }>
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
    if (searchQuery) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }, [searchQuery, customers])

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
        bookings:bookings(
          id,
          booking_date,
          booking_time,
          status,
          service:services(name, price)
        )
      `)
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })

    if (data) {
      setCustomers(data as Customer[])
      setFilteredCustomers(data as Customer[])
    }
    setLoading(false)
  }

  const getCustomerStats = (customer: Customer) => {
    const totalBookings = customer.bookings?.length || 0
    const completedBookings = customer.bookings?.filter(b => b.status === 'completed').length || 0
    const totalSpent = customer.bookings
      ?.filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.service?.price || 0), 0) || 0
    
    const lastBooking = customer.bookings && customer.bookings.length > 0
      ? customer.bookings.sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())[0]
      : null

    return { totalBookings, completedBookings, totalSpent, lastBooking }
  }

  if (loading) {
    return <div>Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clienti</h1>
        <p className="text-gray-600 mt-1">Gestisci l'anagrafica dei tuoi clienti</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Clienti Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Nuovi (ultimo mese)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => {
                const oneMonthAgo = new Date()
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
                return new Date(c.created_at) > oneMonthAgo
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Clienti Attivi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.bookings && c.bookings.length > 0).length}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'Nessun cliente trovato' : 'Nessun cliente'}
            </h3>
            <p className="text-gray-500">
              {searchQuery 
                ? 'Prova a modificare la ricerca' 
                : 'I clienti appariranno qui quando riceverai prenotazioni'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCustomers.map((customer) => {
            const stats = getCustomerStats(customer)
            return (
              <Card key={customer.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{customer.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </CardDescription>
                      </div>
                    </div>
                    {stats.totalBookings > 0 && (
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {stats.totalBookings} prenotazioni
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {customer.email}
                      </div>
                    )}
                    
                    {stats.lastBooking && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Ultima visita: {formatDate(stats.lastBooking.booking_date)}
                      </div>
                    )}

                    {stats.totalSpent > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4" />
                        Totale speso: €{stats.totalSpent.toFixed(2)}
                      </div>
                    )}

                    {customer.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        <strong>Note:</strong> {customer.notes}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Customer Detail Modal (Simple Version) */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCustomer(null)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{selectedCustomer.name}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                  Chiudi
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Contatti</h3>
                <div className="space-y-1 text-sm">
                  <div>📞 {selectedCustomer.phone}</div>
                  {selectedCustomer.email && <div>✉️ {selectedCustomer.email}</div>}
                </div>
              </div>

              {selectedCustomer.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Note</h3>
                  <p className="text-sm text-gray-600">{selectedCustomer.notes}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Storico Prenotazioni</h3>
                {selectedCustomer.bookings && selectedCustomer.bookings.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCustomer.bookings
                      .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())
