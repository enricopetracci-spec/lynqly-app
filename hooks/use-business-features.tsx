'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Feature = {
  code: string
  name: string
  description: string
  icon: string
  enabled: boolean
}

export function useBusinessFeatures() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeatures()
  }, [])

  const loadFeatures = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return
    }

    // Get business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!business) {
      setLoading(false)
      return
    }

    // Get enabled features
    const { data: enabledFeatures } = await supabase
      .from('business_enabled_features')
      .select(`
        enabled,
        features (
          code,
          name,
          description,
          icon
        )
      `)
      .eq('business_id', business.id)
      .eq('enabled', true)

    if (enabledFeatures) {
      const mapped = enabledFeatures.map((ef: any) => ({
        code: ef.features.code,
        name: ef.features.name,
        description: ef.features.description,
        icon: ef.features.icon,
        enabled: ef.enabled
      }))
      setFeatures(mapped)
    }

    setLoading(false)
  }

  const hasFeature = (code: string) => {
    return features.some(f => f.code === code && f.enabled)
  }

  return { features, hasFeature, loading }
}
