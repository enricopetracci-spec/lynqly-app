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
    const { data: business } = await supabase.from('businesses').select('name').eq('user_id', session.user.id).single()
    if (business) setBusinessName(business.name)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const nav = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Statistiche', href: '/dashboard/statistics', icon: TrendingUp },
    { name: 'Prenotazioni', href: '/dashboard/bookings', icon: Calendar },
    { name: 'Servizi', href: '/dashboard/services', icon: Briefcase },
    { name: 'Preventivi', href: '/dashboard/quotes', icon: FileText },
    { name: 'Campagne', href: '/dashboard/campaigns', icon: MessageSquare },
    { name: 'Clienti', href: '/dashboard/clients', icon: Users },
    { name: 'Staff', href: '/dashboard/staff', icon: UserCog },
    { name: 'Impostazioni', href: '/dashboard/settings', icon: Settings }
  ]

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-600">Caricamento...</div></div>

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r">
        <div className="p-6 border-b">
          <div className="font-bold text-xl">Lynqly</div>
          <div className="text-sm text-gray-500">{businessName}</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
        <button onClick={handleLogout} className="m-4 p-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 rounded-lg">
          <LogOut size={20} />
          <span>Esci</span>
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden p-4 bg-white border-b flex items-center justify-between">
          <div className="font-bold">{businessName || 'Lynqly'}</div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </header>

        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
            <div className="w-64 bg-white h-full p-4" onClick={e => e.stopPropagation()}>
              <div className="font-bold mb-4">{businessName}</div>
              {nav.map(item => {
                const Icon = item.icon
                return <Link key={item.name} href={item.href} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50"><Icon size={20} /><span>{item.name}</span></Link>
              })}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  )
}
