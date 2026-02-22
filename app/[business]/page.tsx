'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, Euro, Phone, Mail, User, Check } from 'lucide-react'
import { formatPrice, formatDuration, generateTimeSlots, addDays } from '@/lib/utils'

export default function BookingPage() {
  const params = useParams()
  const businessSlug = params.business as string

  const [business, setBusiness] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1) // 1: select service, 2: select date/time, 3: customer info, 4: success

  // Booking data
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  // Customer data
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadBusinessData()
  }, [businessSlug])

  useEffect(() => {
    if (selectedDate && selectedService) {
      loadAvailableSlots()
    }
  }, [selectedDate, selectedService])

  const loadBusinessData = async () => {
    // Get business by slug
    const { data: businessData } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', businessSlug)
      .eq('is_active', true)
      .single()

    if (!businessData) {
      setLoading(false)
      return
    }

    setBusiness(businessData)

    // Get services
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessData.id)
      .eq('is_active', true)
      .order('price', { ascending: true })

    setServices(servicesData || [])
    setLoading(false)
  }

  const loadAvailableSlots = () => {
    // For now, generate standard slots 9:00-18:00
    // In a real app, this would check staff availability and existing bookings
    const slots = generateTimeSlots(9, 19, selectedService.duration_minutes)
    setAvailableSlots(slots)
  }

  const handleServiceSelect = (service: any) => {
    setSelectedService(service)
    setStep(2)
  }

  const handleDateTimeSelect = () => {
    if (!selectedDate || !selectedTime) return
    setStep(3)
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // 1. Create or get customer
      let customerId = null

      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', business.id)
        .eq('phone', customerPhone)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            business_id: business.id,
            name: customerName,
            phone: customerPhone,
            email: customerEmail || null,
          })
          .select()
          .single()

        customerId = newCustomer?.id
      }

      if (!customerId) throw new Error('Errore nella creazione del cliente')

      // 2. Create booking
      const { error } = await supabase
        .from('bookings')
        .insert({
          business_id: business.id,
          customer_id: customerId,
          service_id: selectedService.id,
          booking_date: selectedDate,
          booking_time: selectedTime,
          status: 'pending',
          customer_notes: customerNotes || null,
        })

      if (error) throw error

      // Success!
      setStep(4)
    } catch (error: any) {
      console.error('Booking error:', error)
      alert('Errore durante la prenotazione. Riprova.')
    } finally {
      setSubmitting(false)
    }
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
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Attività non trovata</h2>
            <p className="text-gray-600">Il link che hai seguito non è valido</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-4">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-16 h-16 rounded-lg" />
            ) : (
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                {business.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              {business.description && (
                <p className="text-gray-600">{business.description}</p>
              )}
              {business.city && (
                <p className="text-sm text-gray-500">{business.city}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Scegli un servizio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardHeader>
                    <CardTitle>{service.name}</CardTitle>
                    {service.description && (
                      <CardDescription>{service.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{formatDuration(service.duration_minutes)}</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatPrice(service.price)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedService && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setStep(1)}>← Indietro</Button>
            
            <Card>
              <CardHeader>
                <CardTitle>Seleziona data e ora</CardTitle>
                <CardDescription>
                  {selectedService.name} - {formatDuration(selectedService.duration_minutes)} - {formatPrice(selectedService.price)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data</label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    max={addDays(new Date(), 30).toISOString().split('T')[0]}
                  />
                </div>

                {selectedDate && availableSlots.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Orario</label>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedTime === slot ? 'default' : 'outline'}
                          onClick={() => setSelectedTime(slot)}
                          className="text-sm"
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDate && selectedTime && (
                  <Button onClick={handleDateTimeSelect} className="w-full">
                    Continua
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setStep(2)}>← Indietro</Button>
            
            <Card>
              <CardHeader>
                <CardTitle>I tuoi dati</CardTitle>
                <CardDescription>
                  Riepilogo: {selectedService.name} - {selectedDate} alle {selectedTime}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome e Cognome *</label>
                    <Input
                      placeholder="Mario Rossi"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Telefono *</label>
                    <Input
                      type="tel"
                      placeholder="+39 123 456 7890"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email (opzionale)</label>
                    <Input
                      type="email"
                      placeholder="mario.rossi@email.it"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Note (opzionale)</label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Eventuali richieste particolari..."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Invio in corso...' : 'Conferma Prenotazione'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 4 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Prenotazione Confermata!</h2>
              <p className="text-gray-600 mb-4">
                Grazie {customerName}! La tua prenotazione è stata ricevuta.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="font-medium">{selectedService.name}</p>
                <p className="text-sm text-gray-600">{selectedDate} alle {selectedTime}</p>
                <p className="text-sm text-gray-600">{business.name}</p>
              </div>
              <p className="text-sm text-gray-500">
                Riceverai una conferma al numero {customerPhone}
                {customerEmail && ` e all'email ${customerEmail}`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
