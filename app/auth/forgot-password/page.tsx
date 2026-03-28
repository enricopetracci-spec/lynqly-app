'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-center">Email Inviata!</CardTitle>
            <CardDescription className="text-center">
              Controlla la tua casella email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center mb-6">
              Ti abbiamo inviato un link per reimpostare la password a <strong>{email}</strong>
            </p>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna al Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Password Dimenticata?</CardTitle>
          <CardDescription>
            Inserisci la tua email e ti invieremo un link per reimpostare la password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tua@email.com"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Invio in corso...' : 'Invia Link Reset'}
            </Button>

            <Link href="/auth/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna al Login
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
