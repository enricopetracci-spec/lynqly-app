'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, Building2, Settings, LogOut, Menu, X, Mail } from 'lucide-react'
import { useIsAdmin } from '@/hooks/use-is-admin'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Check if on login page FIRST - before any auth checks
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // For all other admin pages, use the protected layout
  return <ProtectedAdminLayout>{children}</ProtectedAdminLayout>
}

function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAdmin, loading } = useIsAdmin(true)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login') // FIXED: era '/admin/login' corretto
  }

  const nav = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Richieste Demo', href: '/admin/demo-requests', icon: Mail, badge: true }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Verifica permessi...</div>
      </div>
    )
  }

  if (!isAdmin) {
    // FIXED: Redirect to /admin/login instead of /auth/login
    router.push('/admin/login')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Accesso Negato</h1>
          <p className="text-gray-600 mb-4">Non hai i permessi per accedere a questa sezione.</p>
          <Link href="/admin/login" className="text-red-600 hover:text-red-700 font-medium">
            Vai al Login Admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-red-600 border-b h-16 flex items-center justify-between px-4 text-white">
        <div className="flex items-center gap-3">
          <span className="font-bold">🔐 SUPER ADMIN</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <div className="w-64 bg-white h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b bg-red-600 text-white">
              <div className="font-bold text-lg">🔐 Super Admin</div>
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${active ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'}`}
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
        <div className="p-6 border-b bg-red-600 text-white">
          <div className="font-bold text-xl">🔐 Super Admin</div>
          <div className="text-sm text-red-100">Lynqly Management</div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {nav.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${active ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'}`}
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
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 bg-gray-50">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </>
  )
}
