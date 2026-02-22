'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, Users, Briefcase, UserCog, Settings, LogOut, BarChart3, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToastProvider } from '@/components/ui/toast'
import { BookingNotifications } from '@/components/booking-notifications'

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
    const session = await supabase.auth.getSession()
    
    if (!session.data.session) {
      router.push('/auth/login')
      return
    }
const { data: business } = await supabase
  .from('businesses')
  .select('id, name')
  .eq('user_id', session.data.session.user.id)
  .single()

if (business) {
  setBusinessName(business.name)
  setBusinessId(business.id)
}
   
