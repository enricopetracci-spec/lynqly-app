'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash, Euro, Clock } from 'lucide-react'
import { formatPrice, formatDuration } from '@/lib/utils'

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(30)
  const [price, setPrice] = useState('')

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!business) return

    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    setServices(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!business) return

    const serviceData = {
      business_id: business.id,
      name,
      description: description || null,
      duration_minutes: duration,
      price: parseFloat(price),
      is_active: true,
    }

    if (editingService) {
      // Update
      await supabase
        .from('services')
        .update(serviceData)
        .eq('id', editingService.id)
    } else {
      // Insert
      await supabase
        .from('services')
        .insert(serviceData)
    }

    // Reset form
    resetForm()
    loadServices()
  }

  const handleEdit = (service: any) => {
    setEditingService(service)
    setName(service.name)
    setDescription(service.description || '')
    setDuration(service.duration_minutes)
    setPrice(service.price.toString())
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo servizio?')) return

    await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id)

    loadServices()
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setDuration(30)
    setPrice('')
    setEditingService(null)
    setShowForm(false)
  }

  if (loading) {
    return <div>Caricamento...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Servizi</h1>
          <p className="text-gray-600 mt-1">Gestisci i servizi che offri ai tuoi clienti</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Annulla' : 'Nuovo Servizio'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingService ? 'Modifica Servizio' : 'Nuovo Servizio'}</CardTitle>
            <CardDescription>
              Inserisci i dettagli del servizio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome Servizio *</label>
                  <Input
                    placeholder="Es: Taglio donna"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Prezzo (€) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="35.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Durata (minuti) *</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value={15}>15 minuti</option>
                    <option value={30}>30 minuti</option>
                    <option value={45}>45 minuti</option>
                    <option value={60}>1 ora</option>
                    <option value={90}>1 ora e 30</option>
                    <option value={120}>2 ore</option>
                    <option value={180}>3 ore</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Descrizione (opzionale)</label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Descrizione del servizio..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit">
                  {editingService ? 'Salva Modifiche' : 'Crea Servizio'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun servizio</h3>
            <p className="text-gray-500 mb-4">Inizia creando il tuo primo servizio</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crea Primo Servizio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle className="text-lg">{service.name}</CardTitle>
                {service.description && (
                  <CardDescription>{service.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Euro className="w-4 h-4 mr-2" />
                    <span className="font-semibold">{formatPrice(service.price)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{formatDuration(service.duration_minutes)}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(service)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifica
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
