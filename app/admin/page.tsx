'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type BusinessStats = {
  id: string
  name: string
  slug: string
  business_type: string
  created_at: string
  owner_email: string
  total_bookings: number
  total_customers: number
  total_quotes: number
  total_staff: number
  bookings_last_7d: number
  bookings_last_30d: number
  active_features_count: number
}

export default function AdminDashboard() {
  const [businesses, setBusinesses] = useState<BusinessStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const { data } = await supabase
      .from('admin_business_stats')
      .select('*')

    if (data) {
      setBusinesses(data)
    }
    setLoading(false)
  }

  const totalBusinesses = businesses.length
  const totalBookings = businesses.reduce((sum, b) => sum + (b.total_bookings || 0), 0)
  const totalCustomers = businesses.reduce((sum, b) => sum + (b.total_customers || 0), 0)
  const bookingsLast7d = businesses.reduce((sum, b) => sum + (b.bookings_last_7d || 0), 0)

  if (loading) {
    return <div className="text-center py-12">Caricamento statistiche...</div>
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Panoramica di tutte le istanze Lynqly</p>
        </div>
        <Link 
          href="/admin/instances/new"
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition"
        >
          + Nuova Istanza
        </Link>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Totale Istanze</CardTitle>
            <Building2 className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalBusinesses}</div>
            <p className="text-sm text-gray-500 mt-1">Business attivi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Prenotazioni Totali</CardTitle>
            <Calendar className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalBookings}</div>
            <p className="text-sm text-green-600 mt-1">+{bookingsLast7d} ultimi 7 giorni</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Clienti Totali</CardTitle>
            <Users className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalCustomers}</div>
            <p className="text-sm text-gray-500 mt-1">Across all instances</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tasso Crescita</CardTitle>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">+24%</div>
            <p className="text-sm text-gray-500 mt-1">vs mese scorso</p>
          </CardContent>
        </Card>
      </div>

      {/* BUSINESS LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Istanze Business</CardTitle>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nessuna istanza creata</p>
              <Link 
                href="/admin/instances/new"
                className="text-red-600 hover:text-red-700 mt-2 inline-block"
              >
                Crea la prima istanza
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Proprietario</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Prenotazioni</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Clienti</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Features</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map(business => (
                    <tr key={business.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{business.name}</div>
                        <div className="text-sm text-gray-500">{business.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {business.business_type || 'Non specificato'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{business.owner_email}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-medium">{business.total_bookings || 0}</div>
                        <div className="text-xs text-green-600">+{business.bookings_last_7d || 0} 7d</div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{business.total_customers || 0}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-gray-900">{business.active_features_count || 0}</span>
                        <span className="text-xs text-gray-500">/9</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/admin/instances/${business.id}`}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Gestisci
                        </Link>
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
