'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Building2, Mail, Type, Check } from 'lucide-react'
import Link from 'next/link'

type Feature = {
  id: string
  code: string
  name: string
  description: string
  icon: string
}

export default function NewInstancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [features, setFeatures] = useState<Feature[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    ownerEmail: '',
    ownerPassword: ''
  })

  useEffect(() => {
    loadFeatures()
  }, [])

  const loadFeatures = async () => {
    const { data } = await supabase
      .from('features')
      .select('*')
      .order('name')

    if (data) {
      setFeatures(data)
      // Default: seleziona Dashboard e Settings
      setSelectedFeatures(
        data
          .filter(f => f.code === 'dashboard' || f.code === 'settings')
          .map(f => f.id)
      )
    }
  }

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Crea utente Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.ownerEmail,
        password: formData.ownerPassword,
        email_confirm: true
      })

      if (authError) throw authError

      // 2. Crea slug
      const slug = formData.businessName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      // 3. Crea business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          user_id: authData.user.id,
          name: formData.businessName,
          slug: slug,
          business_type: formData.businessType
        })
        .select()
        .single()

      if (businessError) throw businessError

      // 4. Attiva features selezionate
      const featuresToInsert = selectedFeatures.map(featureId => ({
        business_id: business.id,
        feature_id: featureId,
        enabled: true
      }))

      const { error: featuresError } = await supabase
        .from('business_enabled_features')
        .insert(featuresToInsert)

      if (featuresError) throw featuresError

      alert('✅ Istanza creata con successo!')
      router.push('/admin')

    } catch (error: any) {
      console.error(error)
      alert('❌ Errore: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Crea Nuova Istanza Business
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* INFO BUSINESS */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informazioni Business</h3>
              
              <div>
                <Label htmlFor="businessName">Nome Attività *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  placeholder="Es: Parrucchiere Mario"
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessType">Tipo Attività *</Label>
                <Input
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                  placeholder="Es: Salone Parrucchiere, Ristorante Pizzeria, Studio Dentistico..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Campo libero - scrivi il tipo di attività
                </p>
              </div>
            </div>

            {/* INFO PROPRIETARIO */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Credenziali Proprietario</h3>
              
              <div>
                <Label htmlFor="ownerEmail">Email Proprietario *</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({...formData, ownerEmail: e.target.value})}
                  placeholder="mario@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="ownerPassword">Password Iniziale *</Label>
                <Input
                  id="ownerPassword"
                  type="password"
                  value={formData.ownerPassword}
                  onChange={(e) => setFormData({...formData, ownerPassword: e.target.value})}
                  placeholder="Minimo 6 caratteri"
                  required
                  minLength={6}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Il proprietario potrà cambiarla al primo accesso
                </p>
              </div>
            </div>

            {/* FEATURES */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Funzionalità da Attivare</h3>
              <p className="text-sm text-gray-600">
                Seleziona le funzionalità che saranno disponibili per questa istanza
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map(feature => {
                  const isSelected = selectedFeatures.includes(feature.id)
                  const isRequired = feature.code === 'dashboard' || feature.code === 'settings'
                  
                  return (
                    <div
                      key={feature.id}
                      onClick={() => !isRequired && toggleFeature(feature.id)}
                      className={`
                        border rounded-lg p-4 cursor-pointer transition
                        ${isSelected ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200 hover:border-gray-300'}
                        ${isRequired ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                          ${isSelected ? 'bg-red-600 border-red-600' : 'border-gray-300'}
                        `}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{feature.name}</div>
                          <div className="text-sm text-gray-500 mt-0.5">{feature.description}</div>
                          {isRequired && (
                            <div className="text-xs text-gray-400 mt-1">Obbligatorio</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-3">
                ℹ️ <strong>{selectedFeatures.length} features</strong> selezionate. 
                Dashboard e Impostazioni sono obbligatorie.
              </div>
            </div>

            {/* SUBMIT */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
                {loading ? 'Creazione in corso...' : 'Crea Istanza'}
              </Button>
              <Link href="/admin">
                <Button type="button" variant="outline">Annulla</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
