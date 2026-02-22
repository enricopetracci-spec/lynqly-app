'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Link as LinkIcon, User, Mail, Phone, MapPin, AlertCircle } from 'lucide-react'
import { generateSlug } from '@/lib/utils'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    business_type: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  })

  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }

    setUser(session.user)

    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (business) {
      setFormData({
        name: business.name || '',
        slug: business.slug || '',
        business_type: business.business_type || '',
        description: business.description || '',
        email: business.email || '',
        phone: business.phone || '',
        address: business.address || '',
        city: business.city || '',
      })
    }

    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-generate slug when name changes
    if (name === 'name') {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Check if slug is already taken by another business
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', formData.slug)
      .neq('user_id', session.user.id)
      .single()

    if (existingBusiness) {
      setMessage({ type: 'error', text: 'Questo link è già in uso. Scegli un nome diverso.' })
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('businesses')
      .update({
        name: formData.name,
        slug: formData.slug,
        business_type: formData.business_type,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
      })
      .eq('user_id', session.user.id)

    if (error) {
      setMessage({ type: 'error', text: 'Errore nel salvataggio. Riprova.' })
    } else {
      setMessage({ type: 'success', text: 'Impostazioni salvate con successo!' })
      setTimeout(() => setMessage(null), 3000)
    }

    setSaving(false)
  }

  if (loading) {
    return <div>Caricamento...</div>
  }

  const bookingUrl = `${window.location.origin}/${formData.slug}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Impostazioni</h1>
        <p className="text-gray-600 mt-1">Gestisci le informazioni della tua attività</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Link Pubblico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Link Prenotazioni
          </CardTitle>
          <CardDescription>
            Questo è il link che i tuoi clienti useranno per prenotare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-2 font-medium">Il tuo link pubblico:</div>
            <div className="text-blue-900 font-mono text-sm break-all">{bookingUrl}</div>
          </div>
        </CardContent>
      </Card>

      {/* Informazioni Attività */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informazioni Attività
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Attività *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Es: Salone di Maria"
              />
            </div>

            <div>
              <Label htmlFor="business_type">Tipo di Attività</Label>
              <Input
                id="business_type"
                name="business_type"
                value={formData.business_type}
                onChange={handleChange}
                placeholder="Es: Salone di bellezza, Barbiere, Ristorante"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="slug">Link Personalizzato *</Label>
            <Input
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="es: salone-maria"
            />
            <p className="text-sm text-gray-500 mt-1">
              Questo apparirà nell'URL: {window.location.origin}/<strong>{formData.slug}</strong>
            </p>
          </div>

          <div>
            <Label htmlFor="description">Descrizione</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Breve descrizione della tua attività..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Contatti */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contatti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="info@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="333 1234567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indirizzo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Indirizzo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Indirizzo</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Via Roma 123"
            />
          </div>

          <div>
            <Label htmlFor="city">Città</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Milano"
            />
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            <div className="mb-2">
              <span className="font-medium">Email account:</span> {user?.email}
            </div>
            <p className="text-gray-500 text-xs">
              Per cambiare email o password, contatta il supporto
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Salva */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !formData.name || !formData.slug}
          size="lg"
        >
          {saving ? 'Salvataggio...' : 'Salva Modifiche'}
        </Button>
      </div>
    </div>
  )
}
