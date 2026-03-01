'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Users, FileText, DollarSign, Calendar } from 'lucide-react'

type Period = 'week' | 'month' | 'year'

export default function StatisticsPage() {
  const [period, setPeriod] = useState<Period>('month')
  const [stats, setStats] = useState({
    totalCustomers: 0,
    newCustomers: 0,
    totalQuotes: 0,
    acceptedQuotes: 0,
    rejectedQuotes: 0,
    revenue: 0,
    draftQuotes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [period])

  const getDateRange = () => {
    const now = new Date()
    const start = new Date()

    if (period === 'week') {
      start.setDate(now.getDate() - 7)
    } else if (period === 'month') {
      start.setMonth(now.getMonth() - 1)
    } else if (period === 'year') {
      start.setFullYear(now.getFullYear() - 1)
    }

    return { start: start.toISOString(), end: now.toISOString() }
  }

  const loadStats = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!business) return

    const { start, end } = getDateRange()

    // Total customers
    const { data: allCustomers } = await supabase
      .from('customers')
      .select('id, created_at')
      .eq('business_id', business.id)

    // New customers in period
    const { data: newCustomers } = await supabase
      .from('customers')
      .select('id')
      .eq('business_id', business.id)
      .gte('created_at', start)
      .lte('created_at', end)

    // All quotes
    const { data: allQuotes } = await supabase
      .from('quotes')
      .select('id, status, total, created_at')
      .eq('business_id', business.id)

    // Quotes in period
    const quotesInPeriod = allQuotes?.filter(q => {
      const qDate = new Date(q.created_at)
      return qDate >= new Date(start) && qDate <= new Date(end)
    }) || []

    const acceptedQuotes = quotesInPeriod.filter(q => q.status === 'accepted')
    const rejectedQuotes = quotesInPeriod.filter(q => q.status === 'rejected')
    const draftQuotes = quotesInPeriod.filter(q => q.status === 'draft')
    
    const revenue = acceptedQuotes.reduce((sum, q) => sum + (parseFloat(q.total) || 0), 0)

    setStats({
      totalCustomers: allCustomers?.length || 0,
      newCustomers: newCustomers?.length || 0,
      totalQuotes: quotesInPeriod.length,
      acceptedQuotes: acceptedQuotes.length,
      rejectedQuotes: rejectedQuotes.length,
      draftQuotes: draftQuotes.length,
      revenue
    })

    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const getPeriodLabel = () => {
    if (period === 'week') return 'Ultimi 7 giorni'
    if (period === 'month') return 'Ultimo mese'
    return 'Ultimo anno'
  }

  if (loading) {
    return <div className="p-8">Caricamento...</div>
  }

  const acceptanceRate = stats.totalQuotes > 0 
    ? Math.round((stats.acceptedQuotes / stats.totalQuotes) * 100) 
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Statistiche</h1>
          <p className="text-gray-600">Analisi delle performance della tua attività</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-600">Periodo:</span>
        <div className="flex gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('week')}
          >
            7 giorni
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('month')}
          >
            30 giorni
          </Button>
          <Button
            variant={period === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('year')}
          >
            Anno
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Nuovi Clienti</CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.newCustomers}</div>
            <p className="text-xs text-gray-500 mt-1">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Preventivi Totali</CardTitle>
            <FileText className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuotes}</div>
            <p className="text-xs text-gray-500 mt-1">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tasso Accettazione</CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{acceptanceRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.acceptedQuotes} accettati su {stats.totalQuotes}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fatturato</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenue)}</div>
            <p className="text-xs text-gray-500 mt-1">Da preventivi accettati</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Preventivi per Stato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium text-green-800">✓ Accettati</span>
              <span className="text-2xl font-bold text-green-600">{stats.acceptedQuotes}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="font-medium text-red-800">✗ Rifiutati</span>
              <span className="text-2xl font-bold text-red-600">{stats.rejectedQuotes}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-800">⋯ Bozze</span>
              <span className="text-2xl font-bold text-gray-600">{stats.draftQuotes}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clienti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-medium text-blue-800">Totale Clienti</span>
              <span className="text-2xl font-bold text-blue-600">{stats.totalCustomers}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium text-green-800">Nuovi ({getPeriodLabel()})</span>
              <span className="text-2xl font-bold text-green-600">{stats.newCustomers}</span>
            </div>
            {stats.totalCustomers > 0 && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="font-medium text-purple-800">% Crescita</span>
                <span className="text-2xl font-bold text-purple-600">
                  {Math.round((stats.newCustomers / stats.totalCustomers) * 100)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
