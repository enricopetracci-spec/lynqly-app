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
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('user_id', session.user.id)
      .single()
    if (business) setBusinessName(business.name)
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
    { name: 'Clienti', href: '/dashboard/clients', icon: Users },
    { name: 'Staff', href: '/dashboard/staff', icon: UserCog },
    { name: 'Impostazioni', href: '/dashboard/settings', icon: Settings },
  ]

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-600">Caricamento...</div></div>
  }

  return (
    <div style={{width: '100vw', maxWidth: '100vw', overflow: 'hidden', margin: 0, padding: 0}}>
      {/* MOBILE */}
      <div className="lg:hidden">
        {/* Header */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100vw',
          maxWidth: '100vw',
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          zIndex: 50,
          padding: '12px 16px',
          boxSizing: 'border-box'
        }}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1}}>
              <div style={{width: '32px', height: '32px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px', flexShrink: 0}}>L</div>
              <span style={{fontWeight: 'bold', fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{businessName || 'Lynqly'}</span>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{padding: '8px', flexShrink: 0}}>
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Sidebar Mobile */}
        {sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40}} />
            <div style={{position: 'fixed', top: 0, left: 0, bottom: 0, width: '256px', background: 'white', zIndex: 50, padding: '24px 16px', overflowY: 'auto'}}>
              <div style={{marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb'}}>
                <div style={{fontWeight: 'bold', fontSize: '18px'}}>Lynqly</div>
                <div style={{fontSize: '12px', color: '#6b7280'}}>{businessName}</div>
              </div>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href} onClick={() => setSidebarOpen(false)}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      marginBottom: '4px',
                      background: isActive ? '#eff6ff' : 'transparent',
                      color: isActive ? '#2563eb' : '#374151'
                    }}>
                      <Icon size={20} />
                      <span style={{fontWeight: 500}}>{item.name}</span>
                    </div>
                  </Link>
                )
              })}
              <button onClick={handleLogout} style={{marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px'}}>
                <LogOut size={20} />
                <span>Esci</span>
              </button>
            </div>
          </>
        )}

        {/* Content Mobile */}
        <div style={{
          paddingTop: '70px', 
          paddingLeft: '16px', 
          paddingRight: '16px', 
          paddingBottom: '20px', 
          width: '100vw', 
          maxWidth: '100vw', 
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden'
          }}>
            {children}
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:block">
        <aside style={{position: 'fixed', top: 0, left: 0, bottom: 0, width: '256px', background: 'white', borderRight: '1px solid #e5e7eb', padding: '24px 16px', overflowY: 'auto'}}>
          <div style={{marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb'}}>
            <div style={{fontWeight: 'bold', fontSize: '20px'}}>Lynqly</div>
            <div style={{fontSize: '12px', color: '#6b7280'}}>{businessName}</div>
          </div>
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', marginBottom: '4px', background: isActive ? '#eff6ff' : 'transparent', color: isActive ? '#2563eb' : '#374151'}}>
                  <Icon size={20} />
                  <span style={{fontWeight: 500}}>{item.name}</span>
                </div>
              </Link>
            )
          })}
          <button onClick={handleLogout} style={{marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px'}}>
            <LogOut size={20} />
            <span>Esci</span>
          </button>
        </aside>
        <div style={{marginLeft: '256px', padding: '32px'}}>
          {children}
        </div>
      </div>
    </div>
  )
}
