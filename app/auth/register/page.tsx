'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Rocket, Mail, Phone, Building2, MessageSquare } from 'lucide-react'

export default function DemoRequestPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    business_type: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore invio richiesta')
      }

      setSubmitted(true)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              Richiesta Inviata!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-700 font-medium">
              Ti abbiamo inviato un'email a:
            </p>
            <p className="text-blue-600 font-bold">{formData.email}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-700">
                📧 <strong>Verifica la tua email</strong> per confermare la richiesta.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Controlla anche la cartella spam se non vedi l'email entro 5 minuti.
              </p>
            </div>
            <p className="text-sm text-gray-600 pt-4">
              Ti ricontatteremo entro 24 ore!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Richiedi Demo Gratuita
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Compila il form e ricevi accesso alla piattaforma entro 24 ore
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Nome e Cognome *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Mario Rossi"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefono *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+39 123 456 7890"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="mario@esempio.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Ti invieremo una email di conferma
              </p>
            </div>

            <div>
              <Label htmlFor="business_type" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Tipo di Attività *
              </Label>
              <Input
                id="business_type"
                value={formData.business_type}
                onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                placeholder="es: Salone Parrucchiere, Ristorante, Studio Medico..."
                required
              />
            </div>

            <div>
              <Label htmlFor="message" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Messaggio (opzionale)
              </Label>
              <Input
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Raccontaci delle tue esigenze..."
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? 'Invio in corso...' : 'Invia Richiesta Demo'}
            </Button>

            <p className="text-xs text-center text-gray-500">
              Cliccando "Invia" accetti i nostri termini di servizio e privacy policy
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
