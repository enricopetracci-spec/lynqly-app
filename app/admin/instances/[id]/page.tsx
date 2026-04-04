'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Phone, Building2, Calendar, Clock, Key, ExternalLink, Trash2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

type BusinessDetail = {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  business_type: string
  user_id: string
  created_at: string
}

type Feature = {
  feature_code: string
  enabled: boolean
}

export default function ManageInstancePage() {
  const params = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState<BusinessDetail | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [loginStats, setLoginStats] = useState({ total: 0, lastLogin: null as string | null })
  const [credentials, setCredentials] = useState<{ email: string, password: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBusinessDetails()
  }, [params.id])

  const loadBusinessDetails = async () => {
    try {
      // Get business
      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!businessData) {
        alert('Business non trovato')
        router.push('/admin')
        return
      }

      setBusiness(businessData)

      // Get features
      const { data: allFeatures } = await supabase
        .from('features')
        .select('code, name')

      const { data: enabledFeatures } = await supabase
        .from('business_enabled_features')
        .select('feature_code')
        .eq('business_id', params.id)

      const enabledCodes = enabledFeatures?.map(f => f.feature_code) || []
      const featuresWithStatus = allFeatures?.map(f => ({
        feature_code: f.code,
        name: f.name,
        enabled: enabledCodes.includes(f.code)
      })) || []

      setFeatures(featuresWithStatus as any)

      // Get login stats
      if (businessData.user_id) {
        const { count } = await supabase
          .from('login_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', businessData.user_id)

        const { data: lastLoginData } = await supabase
          .from('login_logs')
          .select('logged_in_at')
          .eq('user_id', businessData.user_id)
          .order('logged_in_at', { ascending: false })
          .limit(1)
          .single()

        setLoginStats({
          total: count || 0,
          lastLogin: lastLoginData?.logged_in_at || null
        })
      }

      // Try to get credentials from demo_requests
      const { data: demoRequest } = await supabase
        .from('demo_requests')
        .select('message')
        .eq('email', businessData.email)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (demoRequest?.message && demoRequest.message.includes('CREDENZIALI')) {
        const lines = demoRequest.message.split('\n')
        const emailLine = lines.find((l: string) => l.includes('Email:'))
        const passwordLine = lines.find((l: string) => l.includes('Password:'))
        
        if (emailLine && passwordLine) {
          const email = emailLine.split('Email:')[1]?.trim()
          const password = passwordLine.split('Password:')[1]?.trim()
          if (email && password) {
            setCredentials({ email, password })
          }
        }
      }

    } catch (error) {
      console.error('Error loading business:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDashboard = () => {
    const params = new URLSearchParams({
      email: business?.email || '',
      password: credentials?.password || '',
      name: business?.name || ''
    })
    
    window.open(`/admin/client-access?${params.toString()}`, '_blank', 'noopener,noreferrer')
  }

  const handleResetPassword = async () => {
    if (!business?.email) return
    
    if (!confirm(`Reset password per ${business.email}?\n\nVerrà inviata email di reset.`)) return

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(business.email, {
        redirectTo: 'https://lynqly-app.vercel.app/auth/reset-password'
      })

      if (error) throw error
      alert('✅ Email di reset inviata!')
    } catch (error: any) {
      alert('❌ Errore: ' + error.message)
    }
  }

  const handleDelete = async () => {
    if (!business) return

    if (!confirm(`⚠️ ATTENZIONE!\n\nStai per eliminare "${business.name}" e TUTTI i suoi dati.\n\nQuesta azione è IRREVERSIBILE!\n\nContinuare?`)) {
      return
    }

    try {
      // Delete business (cascade deletes everything)
      const { error: deleteError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', business.id)

      if (deleteError) throw deleteError

      // Delete user from auth
      if (business.user_id) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await fetch('/api/admin/delete-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ userId: business.user_id })
          })
        }
      }

      alert('✅ Istanza eliminata!')
      router.push('/admin')
    } catch (error: any) {
      alert('❌ Errore: ' + error.message)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Caricamento...</div>
  }

  if (!business) {
    return <div className="text-center py-12">Business non trovato</div>
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = () => {
    if (!loginStats.lastLogin) {
      return <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">🔴 Mai loggato</span>
    }

    const daysSince = Math.floor((Date.now() - new Date(loginStats.lastLogin).getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSince === 0) {
      return <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">🟢 Attivo oggi</span>
    } else if (daysSince < 7) {
      return <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">🟢 Attivo</span>
    } else {
      return <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">🟡 Inattivo {daysSince}g</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla lista
          </Button>
        </Link>
      </div>

      {/* HEADER */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{business.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{business.slug}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {business.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {business.phone}
                </span>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* DATI BUSINESS */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni business</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Nome:</span>
              <span className="font-medium">{business.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Slug:</span>
              <span className="font-medium font-mono text-sm">{business.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo attività:</span>
              <span className="font-medium">{business.business_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">User ID:</span>
              <span className="font-medium font-mono text-xs">{business.user_id}</span>
            </div>
          </CardContent>
        </Card>

        {/* STATISTICHE */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiche utilizzo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Creato il:</span>
              <span className="font-medium">{formatDate(business.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ultimo login:</span>
              <span className="font-medium">
                {loginStats.lastLogin ? formatDate(loginStats.lastLogin) : 'Mai'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Totale login:</span>
              <span className="font-medium">{loginStats.total}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CREDENZIALI */}
      {credentials && (
        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Credenziali accesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{credentials.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Password:</span>
                <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">{credentials.password}</code>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              💡 Credenziali salvate al momento della creazione istanza
            </p>
          </CardContent>
        </Card>
      )}

      {/* FEATURES */}
      <Card>
        <CardHeader>
          <CardTitle>Features abilitate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {features.map(feature => (
              <div
                key={feature.feature_code}
                className={`p-3 rounded-lg border ${
                  feature.enabled
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                <span className="text-sm font-medium">
                  {feature.enabled ? '✅' : '❌'} {(feature as any).name || feature.feature_code}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link href={`/admin/instances/${business.id}/features`}>
              <Button variant="outline" size="sm">
                ⚙️ Modifica features
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* AZIONI */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>Azioni gestione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleOpenDashboard}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Apri dashboard cliente
            </Button>
            <Button 
              onClick={handleResetPassword}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset password
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Azioni pericolose</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleDelete}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Elimina istanza completa
            </Button>
            <p className="text-xs text-gray-600 mt-2">
              ⚠️ Elimina business, dati e utente. Azione irreversibile!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
