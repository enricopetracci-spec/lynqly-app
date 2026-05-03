'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Login with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Login fallito')
      }

      // Check if user is admin
      const { data: adminCheck, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', authData.user.id)
        .single()

      if (adminError || !adminCheck) {
        // Not an admin - logout and show error
        await supabase.auth.signOut()
        throw new Error('Accesso negato: non sei un amministratore')
      }

      // Success - redirect to admin dashboard
      router.push('/admin')
      router.refresh()

    } catch (error: any) {
      console.error('Admin login error:', error)
      setError(error.message || 'Errore durante il login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-red-600 text-white">
          <CardTitle className="text-2xl text-center">
            🔐 Admin Login
          </CardTitle>
          <p className="text-red-100 text-sm text-center mt-2">
            Area riservata amministratori
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email Admin</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lynqly.app"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Accesso in corso...' : 'Accedi come Admin'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Sei un cliente?</p>
            <a href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Vai al login clienti →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
