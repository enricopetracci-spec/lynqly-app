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
    
    if (!session) {
      setIsAdmin(false)
      setLoading(false)
      if (redirectIfNot) router.push('/auth/login')
      return
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    const admin = !!adminUser
    setIsAdmin(admin)
    setLoading(false)

    if (!admin && redirectIfNot) {
      router.push('/dashboard')
    }
  }

  return { isAdmin, loading }
}
