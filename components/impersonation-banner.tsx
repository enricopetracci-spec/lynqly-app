'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ImpersonationBanner() {
  const router = useRouter()
  const [impersonating, setImpersonating] = useState<string | null>(null)

  useEffect(() => {
    const businessName = sessionStorage.getItem('impersonating')
    setImpersonating(businessName)
  }, [])

  const handleReturn = async () => {
    const adminToken = sessionStorage.getItem('admin_return_token')
    if (!adminToken) {
      await supabase.auth.signOut()
      router.push('/admin/login')
      return
    }

    sessionStorage.removeItem('impersonating')
    sessionStorage.removeItem('admin_return_token')
    
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (!impersonating) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-medium">
          ⚠️ Modalità Admin: Stai navigando come "{impersonating}"
        </span>
      </div>
      <Button 
        size="sm" 
        onClick={handleReturn}
        className="bg-black text-yellow-500 hover:bg-gray-800"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Torna ad Admin
      </Button>
    </div>
  )
}
