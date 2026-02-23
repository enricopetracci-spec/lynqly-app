'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Phone, Mail, Calendar, Search, TrendingUp, Tag as TagIcon, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Tag = {
  id: string
  name: string
  emoji: string
  color: string
}

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
  customer_tag_assignments: {
    tag: Tag
  }[]
}

const getColorClass = (color: string) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  }
  return colors[color] || colors.blue
}

export default function ClientsPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showTagAssignment, setShowTagAssignment] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [customers, searchQuery, selectedTagFilter])

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!business) return

    setBusinessId(business.id)

    // Load customers with tags
    const { data: customersData } = await supabase
      .from('customers')
      .select(`
        *,
        bookings(id, booking_date, status),
        customer_tag_assignments(
          tag:customer_tags(id, name, emoji, color)
        )
      `)
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })

    if (customersData) {
      setCustomers(customersData as Customer[])
    }

    // Load available tags
    const { data: tagsData } = await supabase
      .from('customer_tags')
      .select('*')
      .eq('business_id', business.id)
      .order('sort_order')

    if (tagsData) {
      setTags(tagsData)
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

    if (selectedTagFilter) {
      filtered = filtered.filter(c =>
        c.customer_tag_assignments.some(assignment => 
          assignment.tag.id === selectedTagFilter
        )
      )
    }

    setFilteredCustomers(filtered)
  }

  const toggleTag = async (customerId: string, tagId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return

    const hasTag = customer.customer_tag_assignments.some(a => a.tag.id === tagId)

    if (hasTag) {
      // Remove tag
      await supabase
        .from('customer_tag_assignments')
        .delete()
        .eq('customer_id', customerId)
        .eq('tag_id', tagId)
    } else {
      // Add tag
      await supabase
        .from('customer_tag_assignments')
        .insert({
          customer_id: customerId,
          tag_id: tagId
        })
    }

    loadData()
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

      {/* Filters */}
      <div className="flex flex-col gap-4">
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

        {/* Tag Filters */}
        {tags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TagIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filtra per tag:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTagFilter(null)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  !selectedTagFilter 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Tutti
              </button>
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTagFilter(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm border flex items-center gap-1 ${
                    selectedTagFilter === tag.id 
                      ? `${getColorClass(tag.color)} ring-2 ring-offset-1 ring-gray-400`
                      : getColorClass(tag.color)
                  }`}
                >
                  <span>{tag.emoji}</span>
                  <span>{tag.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun cliente trovato</h3>
            <p className="text-gray-500">
              {searchQuery || selectedTagFilter
                ? 'Prova a cercare con altri termini o cambia filtro'
                : 'I clienti appariranno qui quando riceverai prenotazioni'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCustomers.map((customer) => {
            const stats = getCustomerStats(customer)
            const customerTags = customer.customer_tag_assignments.map(a => a.tag)
            
            return (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                          <p className="text-sm text-gray-500">Cliente dal {formatDate(customer.created_at)}</p>
                        </div>
                      </div>

                      {/* Tags */}
                      {customerTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {customerTags.map(tag => (
                            <span
                              key={tag.id}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getColorClass(tag.color)}`}
                            >
                              <span>{tag.emoji}</span>
                              <span>{tag.name}</span>
                            </span>
                          ))}
                        </div>
                      )}

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

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCustomer(customer)
                        setShowTagAssignment(true)
                      }}
                    >
                      <TagIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Tag Assignment Modal */}
      {showTagAssignment && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowTagAssignment(false)}>
          <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TagIcon className="w-5 h-5" />
                Gestisci Tag - {selectedCustomer.name}
              </CardTitle>
              <CardDescription>Seleziona i tag da assegnare al cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tags.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nessun tag disponibile. Creali nelle Impostazioni.
                </p>
              ) : (
                <div className="space-y-2">
                  {tags.map(tag => {
                    const isAssigned = selectedCustomer.customer_tag_assignments.some(a => a.tag.id === tag.id)
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(selectedCustomer.id, tag.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          isAssigned
                            ? `${getColorClass(tag.color)} border-current`
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{tag.emoji}</span>
                          <span className="font-medium">{tag.name}</span>
                        </div>
                        {isAssigned && (
                          <div className="w-5 h-5 bg-current rounded-full flex items-center justify-center text-white">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="flex justify-end pt-3">
                <Button onClick={() => setShowTagAssignment(false)}>
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
