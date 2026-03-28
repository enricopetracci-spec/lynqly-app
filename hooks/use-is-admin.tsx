'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function useIsAdmin(redirectIfNot = false) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    console.log('🔍 Admin check - session email:', session?.user?.email)
    console.log('🔍 Admin check - session user_id:', session?.user?.id)
    
    if (!session) {
      console.log('❌ Admin check - no session')
      setIsAdmin(false)
      setLoading(false)
      if (redirectIfNot) router.push('/auth/login')
      return
    }

    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    console.log('🔍 Admin check - query:', { 
      adminUser, 
      error: error?.message,
      userId: session.user.id 
    })

    const admin = !!adminUser
    console.log(admin ? '✅ IS ADMIN!' : '❌ NOT ADMIN')
    
    setIsAdmin(admin)
    setLoading(false)

    if (!admin && redirectIfNot) {
      console.log('🔄 Redirecting to dashboard')
      router.push('/dashboard')
    }
  }

  return { isAdmin, loading }
}
