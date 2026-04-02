'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Phone, Building2, Check, X, Clock } from 'lucide-react'

type DemoRequest = {
  id: string
  name: string
  email: string
  phone: string
  business_type: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  email_verified: boolean
  created_at: string
}

export default function AdminDemoRequests() {
  const [requests, setRequests] = useState<DemoRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    const { data } = await supabase
      .from('demo_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setRequests(data)
    }
    setLoading(false)
  }

  const handleApprove = async (request: DemoRequest) => {
    if (!confirm(`Approvare richiesta di ${request.name}?\n\nQuesto NON crea automaticamente l'istanza.\nDovrai crearla manualmente da "Nuova Istanza".`)) {
      return
    }

    const { error } = await supabase
      .from('demo_requests')
      .update({ status: 'approved' })
      .eq('id', request.id)

    if (error) {
      alert('Errore: ' + error.message)
      return
    }

    // Send approval email
    try {
      await fetch('/api/admin/approve-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: request.name,
          email: request.email,
          business_type: request.business_type
        })
      })
    } catch (e) {
      console.error('Email error:', e)
    }

    alert('✅ Richiesta approvata!\n\n📧 Email di conferma inviata al cliente.\n\nRicordati di creare l\'istanza manualmente.')
    loadRequests()
  }

  const handleApproveAndCreate = async (request: DemoRequest) => {
    if (!confirm(`🚀 APPROVA E CREA ISTANZA\n\nPer: ${request.name}\nEmail: ${request.email}\n\nVerranno create:\n• Account utente\n• Business "${request.name}"\n• Email con credenziali\n\n⚠️ Dovrai aggiungere le features manualmente dopo!\n\nContinuare?`)) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessione non valida')

      const response = await fetch('/api/admin/auto-create-instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ requestId: request.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante creazione')
      }

      const copyToClipboard = `Email: ${data.credentials.email}\nPassword: ${data.credentials.password}`
      navigator.clipboard.writeText(copyToClipboard)

      alert(`✅ ISTANZA CREATA!\n\nBusiness: ${data.businessName}\n\n📧 CREDENZIALI (copiate negli appunti):\nEmail: ${data.credentials.email}\nPassword: ${data.credentials.password}\nSlug: ${data.credentials.slug}\n\n⚠️ RICORDATI:\n1. Aggiungi FEATURES da "Gestisci"!\n2. Invia TU le credenziali al cliente\n3. Mettiti in copia nell'email`)
      
      if (confirm('Vuoi andare ora in "Gestisci" per aggiungere le features?')) {
        window.location.href = `/admin/instances/${data.businessId}`
      } else {
        loadRequests()
      }

    } catch (error: any) {
      console.error(error)
      alert('❌ Errore: ' + error.message)
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('Rifiutare questa richiesta?')) return

    const { error } = await supabase
      .from('demo_requests')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (!error) {
      loadRequests()
    }
  }

  const pendingCount = requests.filter(r => r.status === 'pending' && r.email_verified).length

  if (loading) {
    return <div className="text-center py-12">Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Richieste Demo</h1>
          <p className="text-gray-600 mt-1">
            {pendingCount > 0 && (
              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                {pendingCount} {pendingCount === 1 ? 'nuova richiesta' : 'nuove richieste'}
              </span>
            )}
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Nessuna richiesta demo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <Card key={request.id} className={
              request.status === 'pending' && request.email_verified 
                ? 'border-2 border-blue-200 bg-blue-50/50' 
                : ''
            }>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {request.name}
                      {!request.email_verified && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-normal">
                          Email non verificata
                        </span>
                      )}
                      {request.status === 'approved' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-normal">
                          ✅ Approvata
                        </span>
                      )}
                      {request.status === 'approved' && request.message && request.message.includes('CREDENZIALI') && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-normal cursor-pointer" 
                              onClick={() => {
                                const lines = request.message.split('\n')
                                const email = lines.find(l => l.includes('Email:'))
                                const password = lines.find(l => l.includes('Password:'))
                                const text = `${email}\n${password}`
                                navigator.clipboard.writeText(text)
                                alert('Credenziali copiate negli appunti!')
                              }}
                              title="Click per copiare credenziali">
                          📋 Credenziali
                        </span>
                      )}
                      {request.status === 'rejected' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-normal">
                          Rifiutata
                        </span>
                      )}
                      {request.status === 'pending' && request.email_verified && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-normal animate-pulse">
                          🔔 Nuova
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(request.created_at).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {request.status === 'pending' && request.email_verified && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveAndCreate(request)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approva e Crea
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApprove(request)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        Solo Approva
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(request.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Rifiuta
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Email:</span>
                      <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline">
                        {request.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Telefono:</span>
                      <a href={`tel:${request.phone}`} className="text-blue-600 hover:underline">
                        {request.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Tipo attività:</span>
                      <span className="font-medium">{request.business_type}</span>
                    </div>
                  </div>
                  {request.message && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 font-medium mb-1">Messaggio:</p>
                      <p className="text-sm text-gray-700">{request.message}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
