'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, User, Phone, Mail, CheckCircle } from 'lucide-react'

export default function PublicBookingPage() {
  const params = useParams()
  const slug = params.business as string

  const [business, setBusiness] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service_id: '',
    booking_date: '',
    booking_time: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [slug])

  const loadData = async () => {
    // Load business by slug
    const { data: bizData } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!bizData) {
      setLoading(false)
      return
    }

    setBusiness(bizData)

    // Load services
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', bizData.id)
      .eq('is_active', true)
      .order('name')

    setServices(servicesData || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // 1. Create or get customer
      let customerId = null

      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', business.id)
        .eq('phone', formData.phone)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            business_id: business.id,
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null
          })
          .select()
          .single()

        customerId = newCustomer?.id
      }

// 2. Create booking
      await supabase.from('bookings').insert({
        business_id: business.id,
        customer_id: customerId,
        service_id: formData.service_id,
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        notes: formData.notes,
        status: 'pending'
      })

      setSuccess(true)
      setFormData({
        name: '',
        phone: '',
        email: '',
        service_id: '',
        booking_date: '',
        booking_time: '',
        notes: ''
      })
    } catch (error) {
      console.error('Booking error:', error)
      alert('Errore durante la prenotazione. Riprova.')
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Caricamento...</div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Attività non trovata</h1>
            <p className="text-gray-600">Il link che hai seguito non è valido</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{business.name}</h1>
          {business.description && (
            <p className="text-gray-600">{business.description}</p>
          )}
          {business.city && (
            <p className="text-sm text-gray-500 mt-2">📍 {business.city}</p>
          )}
        </div>

        {success ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Prenotazione Ricevuta!</h2>
              <p className="text-gray-600 mb-6">Ti contatteremo a breve per confermare l'appuntamento.</p>
              <Button onClick={() => setSuccess(false)}>
                Nuova Prenotazione
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Prenota Appuntamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="pl-10"
                      placeholder="Mario Rossi"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">Telefono *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="pl-10"
                      placeholder="333 1234567"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-10"
                      placeholder="mario@example.com"
                    />
                  </div>
                </div>

                {/* Service */}
                {services.length > 0 && (
                  <div>
                    <Label htmlFor="service">Servizio *</Label>
                    <select
                      id="service"
                      value={formData.service_id}
                      onChange={(e) => setFormData({...formData, service_id: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      <option value="">Seleziona un servizio</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name} - €{service.price} ({service.duration_minutes} min)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date */}
                <div>
                  <Label htmlFor="date">Data *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.booking_date}
                      onChange={(e) => setFormData({...formData, booking_date: e.target.value})}
                      className="pl-10"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                {/* Time */}
                <div>
                  <Label htmlFor="time">Orario *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="time"
                      type="time"
                      value={formData.booking_time}
                      onChange={(e) => setFormData({...formData, booking_time: e.target.value})}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Note (opzionale)</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Eventuali richieste particolari..."
                  />
                </div>

                {/* Submit */}
                <Button type="submit" disabled={submitting} className="w-full" size="lg">
                  {submitting ? 'Invio in corso...' : 'Prenota Ora'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Powered by <strong>Lynqly</strong></p>
        </div>
      </div>
    </div>
  )
}
