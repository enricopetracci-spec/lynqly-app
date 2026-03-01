'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, Users, Briefcase, UserCog, Settings, LogOut, BarChart3, Menu, X, FileText, MessageSquare, TrendingUp } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [businessName, setBusinessName] = useState('')
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const sessionResponse = await supabase.auth.getSession()
    
    if (!sessionResponse.data.session) {
      router.push('/auth/login')
      return
    }

    const userId = sessionResponse.data.session.user.id

    const businessResponse = await supabase
      .from('businesses')
      .select('id, name')
      .eq('user_id', userId)
      .single()

    if (businessResponse.data) {
      setBusinessName(businessResponse.data.name)
      setBusinessId(businessResponse.data.id)
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Statistiche', href: '/dashboard/statistics', icon: TrendingUp },
    { name: 'Prenotazioni', href: '/dashboard/bookings', icon: Calendar },
    { name: 'Servizi', href: '/dashboard/services', icon: Briefcase },
