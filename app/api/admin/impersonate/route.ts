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

    const { userId } = await request.json()

    // Verify admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!adminUser) return NextResponse.json({ error: 'Not admin' }, { status: 403 })

    // Generate session for target user
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: (await supabaseAdmin.auth.admin.getUserById(userId)).data.user!.email!
    })

    if (error) throw error

    return NextResponse.json({ 
      access_token: data.properties.action_link.split('#')[1].split('&')[0].split('=')[1],
      refresh_token: 'impersonation'
    })

  } catch (error: any) {
    console.error('Impersonate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
