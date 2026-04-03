import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Config error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { userId, businessId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Get IP and user agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log the login
    const { error } = await supabaseAdmin
      .from('login_logs')
      .insert({
        user_id: userId,
        business_id: businessId || null,
        ip_address: ip,
        user_agent: userAgent,
        success: true
      })

    if (error) {
      console.error('Login log error:', error)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Log login error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
