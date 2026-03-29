'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, Users, Briefcase, UserCog, Settings, LogOut, BarChart3, Menu, X, FileText, MessageSquare, TrendingUp } from 'lucide-react'
import { NotificationBell } from '@/components/notification-bell'
import { PWAInstallPrompt } from '@/components/pwa-install'
import { RegisterServiceWorker } from '@/components/register-sw'
import { useBusinessFeatures } from '@/hooks/use-business-features'
import { ImpersonationBanner } from '@/components/impersonation-banner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { hasFeature, loading: featuresLoading } = useBusinessFeatures()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }
    const { data: business } = await supabase.from('businesses').select('name').eq('user_id', session.user.id).single()
    if (business) setBusinessName(business.name)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const allNav = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, feature: 'dashboard' },
    { name: 'Statistiche', href: '/dashboard/statistics', icon: TrendingUp, feature: 'statistics' },
    { name: 'Prenotazioni', href: '/dashboard/bookings', icon: Calendar, feature: 'bookings' },
    { name: 'Servizi', href: '/dashboard/services', icon: Briefcase, feature: 'services' },
    { name: 'Preventivi', href: '/dashboard/quotes', icon: FileText, feature: 'quotes' },
    { name: 'Campagne', href: '/dashboard/campaigns', icon: MessageSquare, feature: 'campaigns' },
    { name: 'Clienti', href: '/dashboard/clients', icon: Users, feature: 'clients' },
    { name: 'Staff', href: '/dashboard/staff', icon: UserCog, feature: 'staff' },
    { name: 'Impostazioni', href: '/dashboard/settings', icon: Settings, feature: 'settings' }
  ]

  // Filter nav based on enabled features
  const nav = featuresLoading ? allNav : allNav.filter(item => hasFeature(item.feature))

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-600">Caricamento...</div></div>

  return (
    <>
     <ImpersonationBanner />
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="font-bold">{businessName || 'Lynqly'}</span>
          <NotificationBell />
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <div className="w-64 bg-white h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b">
              <div className="font-bold text-lg">{businessName}</div>
              <div className="mt-3">
                <NotificationBell />
              </div>
            </div>
            <nav className="p-2">
              {nav.map(item => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Link 
                    key={item.name} 
                    href={item.href} 
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="p-4 border-t">
              <button onClick={handleLogout} className="flex items-center gap-3 text-gray-700 w-full px-4 py-3 hover:bg-gray-50 rounded-lg">
                <LogOut size={20} />
                <span>Esci</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-white border-r z-30">
        <div className="p-6 border-b">
          <div className="font-bold text-xl">Lynqly</div>
          <div className="text-sm text-gray-500">{businessName}</div>
          <div className="mt-4">
            <NotificationBell />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {nav.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="flex items-center gap-3 text-gray-700 w-full px-4 py-3 hover:bg-gray-50 rounded-lg">
            <LogOut size={20} />
            <span>Esci</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <PWAInstallPrompt />
      <RegisterServiceWorker />
    </>
  )
}

