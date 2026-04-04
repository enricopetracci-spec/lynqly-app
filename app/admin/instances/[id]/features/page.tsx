'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type Feature = {
  code: string
  name: string
  description: string
  enabled: boolean
}

export default function ModifyFeaturesPage() {
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

      // Get all features
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
    } finally {
      setLoading(false)
    }
  }

  const toggleFeature = (code: string) => {
    setFeatures(prev =>
      prev.map(f =>
        f.code === code ? { ...f, enabled: !f.enabled } : f
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Delete all existing features
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
            <h1 className="text-2xl font-bold">Modifica Features</h1>
            <p className="text-sm text-gray-600">{businessName}</p>
          </div>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <>Salvataggio...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salva modifiche
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Features disponibili</CardTitle>
          <p className="text-sm text-gray-600">
            Abilita o disabilita le funzionalità per questa istanza
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {features.map(feature => (
              <div
                key={feature.code}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{feature.name}</h3>
                  {feature.description && (
                    <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                  )}
                  <code className="text-xs text-gray-400 mt-1 block">{feature.code}</code>
                </div>
                <button
                  onClick={() => toggleFeature(feature.code)}
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    feature.enabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      feature.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {features.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nessuna feature disponibile
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900">💡 Come funziona</h3>
            <p className="text-sm text-blue-800 mt-1">
              Le features disabilitate non saranno visibili nel menu della dashboard cliente.
              Le modifiche hanno effetto immediato dopo il salvataggio.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
