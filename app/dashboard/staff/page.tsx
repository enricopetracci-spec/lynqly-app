'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Plus, Mail, Phone, CheckCircle, XCircle, Calendar, TrendingUp } from 'lucide-react'

type StaffMember = {
  id: string
  name: string
  email: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  staff_services: {
    service: {
      id: string
      name: string
    }
  }[]
  bookings: {
    id: string
    booking_date: string
    status: string
  }[]
}

type Service = {
  id: string
  name: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    selectedServices: [] as string[]
  })

  useEffect(() => {
    loadData()
  }, [])

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

    // Load staff
    const { data: staffData } = await supabase
      .from('staff')
      .select(`
        *,
        staff_services(
          service:services(id, name)
        ),
        bookings(id, booking_date, status)
      `)
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })

    if (staffData) {
      setStaff(staffData as StaffMember[])
    }

    // Load services
    const { data: servicesData } = await supabase
      .from('services')
      .select('id, name')
      .eq('business_id', business.id)
      .eq('is_active', true)

    if (servicesData) {
      setServices(servicesData)
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!businessId) return

    // Create staff member
    const { data: newStaff, error: staffError } = await supabase
      .from('staff')
      .insert({
        business_id: businessId,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        is_active: true
      })
      .select()
      .single()

    if (staffError || !newStaff) {
      alert('Errore nella creazione dello staff')
      return
    }

    // Assign services
    if (formData.selectedServices.length > 0) {
      const staffServices = formData.selectedServices.map(serviceId => ({
        staff_id: newStaff.id,
        service_id: serviceId
      }))

      await supabase
        .from('staff_services')
        .insert(staffServices)
    }

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      selectedServices: []
    })
    setShowAddForm(false)
    loadData()
  }

  const toggleStaffStatus = async (staffId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: !currentStatus })
      .eq('id', staffId)

    if (!error) {
      loadData()
    }
  }

  const getStaffStats = (member: StaffMember) => {
    const totalBookings = member.bookings.length
    const completedBookings = member.bookings.filter(b => b.status === 'completed').length
    const upcomingBookings = member.bookings.filter(b => 
      b.status === 'confirmed' && new Date(b.booking_date) >= new Date()
    ).length

    return { totalBookings, completedBookings, upcomingBookings }
  }

  if (loading) {
    return <div>Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-1">Gestisci il tuo team e assegna servizi</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Totale Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Attivi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {staff.filter(s => s.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Servizi Coperti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {services.filter(service => 
                staff.some(member => 
                  member.staff_services.some(ss => ss.service.id === service.id)
                )
              ).length} / {services.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle>Aggiungi Membro Staff</CardTitle>
              <CardDescription>Inserisci i dati del nuovo collaboratore</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Mario Rossi"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="mario@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="333 1234567"
                    />
                  </div>
                </div>

                <div>
                  <Label>Servizi Assegnati</Label>
                  <div className="space-y-2 mt-2">
                    {services.map(service => (
                      <label key={service.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectedServices.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                selectedServices: [...formData.selectedServices, service.id]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                selectedServices: formData.selectedServices.filter(id => id !== service.id)
                              })
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Annulla
                  </Button>
                  <Button type="submit">
                    Salva
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Staff List */}
      {staff.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuno staff ancora</h3>
            <p className="text-gray-500 mb-4">Aggiungi i tuoi collaboratori per gestire prenotazioni e servizi</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Primo Membro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {staff.map((member) => {
            const stats = getStaffStats(member)
            return (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        member.is_active ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Users className={`w-6 h-6 ${
                          member.is_active ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{member.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {member.is_active ? (
                            <span className="flex items-center gap-1 text-sm text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              Attivo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-sm text-gray-500">
                              <XCircle className="w-4 h-4" />
                              Non attivo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleStaffStatus(member.id, member.is_active)}
                    >
                      {member.is_active ? 'Disattiva' : 'Attiva'}
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    {member.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>

                  {member.staff_services.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Servizi:</h4>
                      <div className="flex flex-wrap gap-2">
                        {member.staff_services.map(ss => (
                          <span key={ss.service.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {ss.service.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="text-lg font-semibold">{stats.totalBookings}</div>
                      <div className="text-xs text-gray-500">Totali</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div className="text-lg font-semibold">{stats.completedBookings}</div>
                      <div className="text-xs text-gray-500">Completate</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="text-lg font-semibold">{stats.upcomingBookings}</div>
                      <div className="text-xs text-gray-500">Prossime</div>
                    </div>
                  </div>
                </CardContent>
