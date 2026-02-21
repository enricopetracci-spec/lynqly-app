'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Step 2: Business
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('salon')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')

  const handleRegisterAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Le password non corrispondono')
      return
    }

    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri')
      return
    }

    setStep(2)
  }

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Errore durante la creazione dell\'account')
      }

      // 2. Create business
      const slug = generateSlug(businessName)
      
      const { error: businessError } = await supabase
        .from('businesses')
        .insert({
          user_id: authData.user.id,
          name: businessName,
          slug: slug,
          business_type: businessType,
          phone: phone,
          city: city,
          is_active: true,
        })

      if (businessError) throw businessError

      // 3. Create default business settings
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', authData.user.id)
        .single()

      if (business) {
        await supabase.from('business_settings').insert({
          business_id: business.id,
          booking_buffer_minutes: 15,
          advance_booking_days: 30,
          cancellation_hours: 24,
          auto_confirm_bookings: false,
          send_email_notifications: true,
        })
      }

      // Success! Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'Errore durante la registrazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
            L
          </div>
          <span className="text-3xl font-bold text-gray-900">Lynqly</span>
        </Link>

        {/* Progress */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? 'Crea il tuo account' : 'Configura la tua attività'}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? 'Inizia con email e password' 
                : 'Dati della tua attività (puoi modificarli dopo)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRegisterAccount} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tuo@email.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Conferma Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Continua
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Hai già un account?{' '}
                  <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                    Accedi
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateBusiness} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="businessName" className="text-sm font-medium">
                    Nome Attività *
                  </label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Es: Salone Bellezza Roma"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    disabled={loading}
                  />
                  {businessName && (
                    <p className="text-xs text-gray-500">
                      Il tuo link sarà: lynqly.app/{generateSlug(businessName)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="businessType" className="text-sm font-medium">
                    Tipo di Attività *
                  </label>
                  <select
                    id="businessType"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                    disabled={loading}
                  >
                    <option value="salon">Salone di bellezza</option>
                    <option value="barber">Barbiere</option>
                    <option value="spa">Centro estetico</option>
                    <option value="nails">Centro unghie</option>
                    <option value="massage">Centro massaggi</option>
                    <option value="tattoo">Studio tatuaggi</option>
                    <option value="gym">Palestra</option>
                    <option value="other">Altro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Telefono
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+39 123 456 7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="city" className="text-sm font-medium">
                    Città
                  </label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Es: Roma"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Indietro
                  </Button>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creazione in corso...' : 'Crea Account'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-4">
          Registrandoti accetti i nostri{' '}
          <Link href="/terms" className="underline">Termini e Condizioni</Link>
          {' '}e la{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
