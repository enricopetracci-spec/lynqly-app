'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

type Feature = {
  code: string
  name: string
  description: string | null
  enabled: boolean
}

export default function ManageFeaturesPage() {
  const params = useParams()
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadFeatures()
  }, [params.id])

  const loadFeatures = async () => {
    try {
      // Get business name
      const { data: business } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', params.id)
        .single()

      if (business) setBusinessName(business.name)

      // Get all available features
      const { data: allFeatures } = await supabase
        .from('features')
        .select('code, name, description')
        .order('name')

      // Get enabled features for this business
      const { data: enabledFeatures } = await supabase
        .from('business_enabled_features')
        .select('feature_code')
        .eq('business_id', params.id)

      const enabledCodes = enabledFeatures?.map(f => f.feature_code) || []

      const featuresWithStatus = allFeatures?.map(f => ({
        ...f,
        enabled: enabledCodes.includes(f.code)
      })) || []

      setFeatures(featuresWithStatus)
    } catch (error) {
      console.error('Error loading features:', error)
      alert('Errore caricamento features')
    } finally {
      setLoading(false)
    }
  }

  const toggleFeature = (code: string) => {
    setFeatures(features.map(f => 
      f.code === code ? { ...f, enabled: !f.enabled } : f
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Delete all existing features for this business
      await supabase
        .from('business_enabled_features')
        .delete()
        .eq('business_id', params.id)

      // Insert enabled features
      const enabledFeatures = features
        .filter(f => f.enabled)
        .map(f => ({
          business_id: params.id,
          feature_code: f.code
        }))

      if (enabledFeatures.length > 0) {
        const { error } = await supabase
          .from('business_enabled_features')
          .insert(enabledFeatures)

        if (error) throw error
      }

      alert('✅ Features salvate!')
      router.push(`/admin/instances/${params.id}`)
    } catch (error: any) {
      console.error('Error saving features:', error)
      alert('❌ Errore: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/instances/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna a Gestisci
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Gestione Features</h1>
            <p className="text-sm text-gray-600">{businessName}</p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvataggio...' : 'Salva Modifiche'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Features disponibili</CardTitle>
          <p className="text-sm text-gray-600">
            Attiva o disattiva le funzionalità per questa istanza
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {features.map(feature => (
              <div
                key={feature.code}
                className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                  feature.enabled
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
                onClick={() => toggleFeature(feature.code)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          feature.enabled
                            ? 'bg-green-600 border-green-600'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {feature.enabled && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${feature.enabled ? 'text-green-900' : 'text-gray-900'}`}>
                          {feature.name}
                        </h3>
                        {feature.description && (
                          <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    feature.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {feature.enabled ? 'ATTIVA' : 'DISATTIVA'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {features.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nessuna feature disponibile nel sistema
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href={`/admin/instances/${params.id}`}>
          <Button variant="outline">Annulla</Button>
        </Link>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvataggio...' : 'Salva Modifiche'}
        </Button>
      </div>
    </div>
  )
}
