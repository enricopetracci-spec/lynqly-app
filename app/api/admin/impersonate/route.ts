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

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get user email
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (!targetUser?.user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate magic link (one-time login link)
    const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.user.email,
      options: {
        redirectTo: `${supabaseUrl.replace('.supabase.co', '')}/dashboard`
      }
    })

    if (magicLinkError || !magicLinkData) {
      console.error('Magic link error:', magicLinkError)
      return NextResponse.json({ error: 'Failed to generate magic link' }, { status: 500 })
    }

    // Return magic link URL
    return NextResponse.json({
      success: true,
      magicLink: magicLinkData.properties.action_link
    })

  } catch (error: any) {
    console.error('Impersonate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
