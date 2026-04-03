'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, TrendingUp, Trash2, LogIn, Mail, Clock } from 'lucide-react'
import Link from 'next/link'

type BusinessStats = {
  id: string
  name: string
  slug: string
  email: string
  user_id: string | null
  created_at: string
  last_login: string | null
}

export default function AdminDashboard() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<BusinessStats[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    activeToday: 0,
    inactive: 0
  })

  useEffect(() => {
    loadStats()
    loadPendingRequests()
  }, [])

  const loadPendingRequests = async () => {
    const { count } = await supabase
      .from('demo_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('email_verified', true)

    setPendingRequests(count || 0)
  }

  const loadStats = async () => {
    try {
      // Get all businesses with last login info
      const { data: businessesData, error } = await supabase
        .from('businesses')
        .select(`
          id,
          name,
          slug,
          email,
          user_id,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!businessesData) {
        setBusinesses([])
        setLoading(false)
        return
      }

      // Get login logs for all users
      const userIds = businessesData
        .map(b => b.user_id)
        .filter(Boolean) as string[]

      let loginData: any[] = []
      if (userIds.length > 0) {
        const { data: logins } = await supabase
          .from('login_logs')
          .select('user_id, logged_in_at')
          .in('user_id', userIds)
          .order('logged_in_at', { ascending: false })
        
        loginData = logins || []
      }

      // Map last login to each business
      const businessesWithLogin = businessesData.map(business => {
        const userLogins = loginData.filter(l => l.user_id === business.user_id)
        const lastLogin = userLogins.length > 0 ? userLogins[0].logged_in_at : null
        
        return {
          ...business,
          last_login: lastLogin
        }
      })

      setBusinesses(businessesWithLogin)

      // Calculate stats
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const activeToday = businessesWithLogin.filter(b => {
        if (!b.last_login) return false
        return new Date(b.last_login) > oneDayAgo
      }).length

      const inactive = businessesWithLogin.filter(b => {
        if (!b.last_login) return false
        return new Date(b.last_login) < sevenDaysAgo
      }).length

      setStats({
        total: businessesWithLogin.length,
        activeToday,
        inactive
      })

    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (businessId: string, businessName: string) => {
    if (!confirm(`⚠️ ATTENZIONE!\n\nStai per eliminare "${businessName}" e TUTTI i suoi dati:\n• Prenotazioni\n• Clienti\n• Servizi\n• Impostazioni\n\nQuesta azione è IRREVERSIBILE!\n\nContinuare?`)) {
      return
    }

    setDeleting(businessId)

    try {
      const { data: business } = await supabase
        .from('businesses')
        .select('user_id')
        .eq('id', businessId)
        .single()

      if (!business?.user_id) {
        throw new Error('Business senza user_id')
      }

      // Delete business (cascade deletes everything)
      const { error: deleteError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId)

      if (deleteError) throw deleteError

      // Delete user from auth
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

      alert('✅ Istanza eliminata con successo!')
      loadStats()

    } catch (error: any) {
      console.error('Delete error:', error)
      alert('❌ Errore: ' + error.message)
    } finally {
      setDeleting(null)
    }
  }

  const handleImpersonate = async (businessId: string, businessName: string) => {
    try {
      const business = businesses.find(b => b.id === businessId)
      
      if (!business) {
        alert('❌ Business non trovato')
        return
      }

      if (!business.user_id) {
        alert('❌ Questo business non ha un utente associato')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('❌ Sessione non valida')
        return
      }

      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          businessId: businessId,
          userId: business.user_id 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore impersonation')
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      }

    } catch (error: any) {
      console.error('Impersonate error:', error)
      alert('❌ Errore: ' + error.message)
    }
  }

  const getStatusBadge = (lastLogin: string | null) => {
    if (!lastLogin) {
      return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">🔴 Mai loggato</span>
    }

    const now = new Date()
    const loginDate = new Date(lastLogin)
    const daysSince = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince === 0) {
      return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">🟢 Attivo oggi</span>
    } else if (daysSince < 7) {
      return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">🟢 Attivo</span>
    } else {
      return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">🟡 Inattivo {daysSince}g</span>
    }
  }

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Mai'
    
    const date = new Date(lastLogin)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} min fa`
    if (diffHours < 24) return `${diffHours}h fa`
    if (diffDays < 7) return `${diffDays}g fa`
    
    return date.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  if (loading) {
    return <div className="text-center py-12">Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      {pendingRequests > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-full">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-blue-900">
                {pendingRequests} {pendingRequests === 1 ? 'Nuova richiesta demo' : 'Nuove richieste demo'}
              </p>
              <p className="text-sm text-blue-700">Clienti in attesa di approvazione</p>
            </div>
          </div>
          <Link 
            href="/admin/demo-requests"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Gestisci Richieste →
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-1">Panoramica di tutte le istanze Lynqly</p>
        </div>
        <Link href="/admin/instances/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Building2 className="w-4 h-4 mr-2" />
            Nuova Istanza
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Totale Istanze</CardTitle>
            <Building2 className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Attive Oggi</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inattive 7+ giorni</CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inactive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Richieste Pending</CardTitle>
            <Mail className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingRequests}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Istanze Business</CardTitle>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Nessuna istanza creata</p>
              <Link href="/admin/instances/new">
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                  Crea Prima Istanza
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proprietario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ultimo Accesso</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creato</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {businesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{business.name}</div>
                        <div className="text-sm text-gray-500">{business.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{business.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatLastLogin(business.last_login)}</td>
                      <td className="px-4 py-3">{getStatusBadge(business.last_login)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(business.created_at).toLocaleDateString('it-IT')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/instances/${business.id}`}>
                            <Button size="sm" variant="ghost">Gestisci</Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleImpersonate(business.id, business.name)}
                          >
                            <LogIn className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(business.id, business.name)}
                            disabled={deleting === business.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleting === business.id ? (
                              '...'
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
