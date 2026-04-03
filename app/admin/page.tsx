'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Mail, Trash2, LogIn, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type BusinessStats = {
  id: string
  name: string
  email: string
  created_at: string
  user_id: string
  last_login?: string
  status: 'active' | 'inactive' | 'error'
}

type DashboardStats = {
  totalInstances: number
  activeToday: number
  inactiveWeek: number
  pendingRequests: number
  errorInstances: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<BusinessStats[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalInstances: 0,
    activeToday: 0,
    inactiveWeek: 0,
    pendingRequests: 0,
    errorInstances: 0
  })
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboard = async () => {
    await Promise.all([
      loadBusinesses(),
      loadStats()
    ])
    setLoading(false)
  }

  const loadBusinesses = async () => {
    const { data } = await supabase
      .from('businesses')
      .select('id, name, email, created_at, user_id')
      .order('created_at', { ascending: false })

    if (data) {
      // Get last login for each business
      const businessesWithLogin = await Promise.all(
        data.map(async (business) => {
          const { data: loginData } = await supabase
            .from('login_logs')
            .select('login_at')
            .eq('business_id', business.id)
            .order('login_at', { ascending: false })
            .limit(1)
            .single()

          const lastLogin = loginData?.login_at
          const daysSinceLogin = lastLogin 
            ? Math.floor((Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24))
            : 999

          return {
            ...business,
            last_login: lastLogin || null,
            status: daysSinceLogin === 0 ? 'active' : daysSinceLogin > 7 ? 'inactive' : 'error'
          }
        })
      )

      setBusinesses(businessesWithLogin as BusinessStats[])
    }
  }

  const loadStats = async () => {
    // Total instances
    const { count: totalInstances } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })

    // Pending requests
    const { count: pendingRequests } = await supabase
      .from('demo_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('email_verified', true)

    // Active today (logged in last 24h)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const { data: activeLogins } = await supabase
      .from('login_logs')
      .select('business_id')
      .gte('login_at', yesterday.toISOString())

    const activeToday = new Set(activeLogins?.map(l => l.business_id) || []).size

    // Inactive 7+ days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data: allBusinesses } = await supabase
      .from('businesses')
      .select('id')

    const { data: recentLogins } = await supabase
      .from('login_logs')
      .select('business_id')
      .gte('login_at', weekAgo.toISOString())

    const recentBusinessIds = new Set(recentLogins?.map(l => l.business_id) || [])
    const inactiveWeek = (allBusinesses?.length || 0) - recentBusinessIds.size

    setStats({
      totalInstances: totalInstances || 0,
      activeToday,
      inactiveWeek,
      pendingRequests: pendingRequests || 0,
      errorInstances: 0 // TODO: implement error tracking
    })
  }

  const handleDelete = async (businessId: string, businessName: string) => {
    if (!confirm(`⚠️ ATTENZIONE!\n\nStai per eliminare "${businessName}" e TUTTI i suoi dati:\n- Prenotazioni\n- Clienti\n- Servizi\n- Impostazioni\n\nQuesta azione è IRREVERSIBILE!\n\nContinuare?`)) {
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
        throw new Error('Business non trovato')
      }

      // Delete business (cascade deletes everything)
      const { error: businessError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId)

      if (businessError) throw businessError

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
      loadDashboard()

    } catch (error: any) {
      console.error('Delete error:', error)
      alert('❌ Errore durante eliminazione: ' + error.message)
    } finally {
      setDeleting(null)
    }
  }

  const handleImpersonate = async (businessId: string) => {
    try {
      const { data: business } = await supabase
        .from('businesses')
        .select('user_id, name')
        .eq('id', businessId)
        .single()

      if (!business) {
        alert('❌ Business non trovato')
        return
      }

      if (!business.user_id) {
        alert('❌ Questo business non ha un user_id associato')
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
        body: JSON.stringify({ userId: business.user_id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore impersonation')
      }

      // Store admin session for return
      localStorage.setItem('admin_return_token', session.access_token)
      localStorage.setItem('impersonating_business', business.name)

      // Set new session
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      })

      // Redirect to dashboard
      window.location.href = '/dashboard'

    } catch (error: any) {
      console.error('Impersonate error:', error)
      alert('❌ Errore: ' + error.message)
    }
  }

  const getStatusBadge = (status: string, lastLogin?: string) => {
    if (!lastLogin) {
      return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Mai loggato</span>
    }

    const daysSince = Math.floor((Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince === 0) {
      return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">🟢 Attivo oggi</span>
    } else if (daysSince <= 7) {
      return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">🟡 {daysSince}g fa</span>
    } else {
      return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">🔴 Inattivo {daysSince}g</span>
    }
  }

  if (loading) {
    return <div className="text-center py-12">Caricamento dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {/* Alert Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Istanze Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalInstances}</div>
            <p className="text-xs text-gray-500 mt-1">Tutte le istanze attive</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Attive Oggi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{stats.activeToday}</div>
            <p className="text-xs text-green-600 mt-1">Login nelle ultime 24h</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Inattive 7+ giorni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700">{stats.inactiveWeek}</div>
            <p className="text-xs text-yellow-600 mt-1">Nessun accesso recente</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Richieste Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{stats.pendingRequests}</div>
            <Link href="/admin/demo-requests" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
              Gestisci →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Instances Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Istanze Business</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {businesses.length} {businesses.length === 1 ? 'istanza' : 'istanze'}
              </p>
            </div>
            <Link href="/admin/instances/new">
              <Button>
                <Building2 className="w-4 h-4 mr-2" />
                Nuova Istanza
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Nessuna istanza creata</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Business</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Proprietario</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Creato il</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ultimo Accesso</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map(business => (
                    <tr key={business.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{business.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <a href={`mailto:${business.email}`} className="text-blue-600 hover:underline text-sm">
                          {business.email}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(business.created_at).toLocaleDateString('it-IT')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {business.last_login 
                          ? new Date(business.last_login).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(business.status, business.last_login || undefined)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/instances/${business.id}`}>
                            <Button size="sm" variant="outline">
                              Gestisci
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleImpersonate(business.id)}
                            className="text-blue-600 hover:text-blue-700"
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
                            <Trash2 className="w-4 h-4" />
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

