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

    const { businessId } = await request.json()

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

    // Get business user_id
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('user_id')
      .eq('id', businessId)
      .single()

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    // Delete business (cascade deletes features, bookings, etc)
    await supabaseAdmin.from('businesses').delete().eq('id', businessId)

    // Delete user
    await supabaseAdmin.auth.admin.deleteUser(business.user_id)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
