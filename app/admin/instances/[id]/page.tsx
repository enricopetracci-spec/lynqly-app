'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Check, Calendar, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'

type Feature = {
  id: string
  code: string
  name: string
  description: string
}

type BusinessInfo = {
  id: string
  name: string
  slug: string
  business_type: string
  owner_email: string
  total_bookings: number
  total_customers: number
  total_quotes: number
  bookings_last_7d: number
}

export default function ManageInstancePage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [business, setBusiness] = useState<BusinessInfo | null>(null)
  const [allFeatures, setAllFeatures] = useState<Feature[]>([])
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [businessId])

  const loadData = async () => {
    // Load business info
    const { data: businessData } = await supabase
      .from('admin_business_stats')
      .select('*')
      .eq('id', businessId)
      .single()

    if (businessData) {
      setBusiness(businessData)
    }

    // Load all features
    const { data: featuresData } = await supabase
      .from('features')
      .select('*')
      .order('name')

    if (featuresData) {
      setAllFeatures(featuresData)
    }

    // Load enabled features
    const { data: enabledData } = await supabase
      .from('business_enabled_features')
      .select('feature_id')
      .eq('business_id', businessId)
      .eq('enabled', true)

    if (enabledData) {
      setEnabledFeatures(enabledData.map(e => e.feature_id))
    }

    setLoading(false)
  }

  const toggleFeature = (featureId: string) => {
    setEnabledFeatures(prev => 
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    )
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      // Delete all existing
      await supabase
        .from('business_enabled_features')
        .delete()
        .eq('business_id', businessId)

      // Insert new selection
      const toInsert = enabledFeatures.map(featureId => ({
        business_id: businessId,
        feature_id: featureId,
        enabled: true
      }))

      const { error } = await supabase
        .from('business_enabled_features')
        .insert(toInsert)

      if (error) throw error

      alert('✅ Features aggiornate con successo!')
      router.push('/admin')

    } catch (error: any) {
      console.error(error)
      alert('❌ Errore: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Caricamento...</div>
  }

  if (!business) {
    return <div className="text-center py-12">Business non trovato</div>
  }

  const isRequired = (code: string) => code === 'dashboard' || code === 'settings'

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

      {/* BUSINESS INFO */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                {business.name}
              </CardTitle>
              <div className="text-sm text-gray-500 mt-1">
                {business.business_type} • {business.owner_email}
              </div>
            </div>
            <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded">
              {business.slug}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{business.total_bookings || 0}</div>
              <div className="text-sm text-gray-600">Prenotazioni</div>
              <div className="text-xs text-green-600 mt-1">+{business.bookings_last_7d || 0} 7d</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{business.total_customers || 0}</div>
              <div className="text-sm text-gray-600">Clienti</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{business.total_quotes || 0}</div>
              <div className="text-sm text-gray-600">Preventivi</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FEATURES MANAGEMENT */}
      <Card>
        <CardHeader>
          <CardTitle>Gestione Funzionalità</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Seleziona quali funzionalità saranno disponibili per questo business
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allFeatures.map(feature => {
              const isEnabled = enabledFeatures.includes(feature.id)
              const required = isRequired(feature.code)
              
              return (
                <div
                  key={feature.id}
                  onClick={() => !required && toggleFeature(feature.id)}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition
                    ${isEnabled ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200 hover:border-gray-300'}
                    ${required ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                      ${isEnabled ? 'bg-red-600 border-red-600' : 'border-gray-300'}
                    `}>
                      {isEnabled && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{feature.name}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{feature.description}</div>
                      {required && (
                        <div className="text-xs text-gray-400 mt-1">Obbligatorio</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-gray-700">
            ℹ️ <strong>{enabledFeatures.length} features</strong> attualmente selezionate. 
            Dashboard e Impostazioni sono obbligatorie.
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
            <Link href="/admin">
              <Button variant="outline">Annulla</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
