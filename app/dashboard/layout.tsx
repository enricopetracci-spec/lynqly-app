'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, Users, Briefcase, UserCog, Settings, LogOut, BarChart3, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const session = await supabase.auth.getSession()
    
    if (!session.data.session) {
      router.push('/auth/login')
      return
    }

    const business = await supabase
      .from('businesses')
      .select('name')
      .eq('user_id', session.data.session.user.id)
      .single()

    if (business.data) {
      setBusinessName(business.data.name)
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Prenotazioni', href: '/dashboard/bookings', icon: Calendar },
    { name: 'Servizi', href: '/dashboard/services', icon: Briefcase },
    {
