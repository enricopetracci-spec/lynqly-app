import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function generatePassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function generateSlug(text: string) {
  const base = text
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  return `${base}-${randomSuffix}`
}

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

    const { requestId } = await request.json()

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

    // Get demo request
    const { data: demoRequest, error: demoError } = await supabaseAdmin
      .from('demo_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (demoError || !demoRequest) {
      return NextResponse.json({ error: 'Demo request not found' }, { status: 404 })
    }

    if (demoRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 })
    }

    // Generate password
    const password = generatePassword()
    const slug = generateSlug(demoRequest.name)

    // Create user
    const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: demoRequest.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: demoRequest.name,
        business_type: demoRequest.business_type
      }
    })

    if (userError) {
      console.error('User creation error:', userError)
      return NextResponse.json({ error: 'Failed to create user: ' + userError.message }, { status: 500 })
    }

    // Create business
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert({
        name: demoRequest.name,
        slug: slug,
        business_type: demoRequest.business_type,
        phone: demoRequest.phone,
        email: demoRequest.email,
        user_id: newUser.user.id
      })
      .select()
      .single()

    if (businessError) {
      // Rollback: delete user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      console.error('Business creation error:', businessError)
      return NextResponse.json({ error: 'Failed to create business: ' + businessError.message }, { status: 500 })
    }

    // Store credentials in demo_requests for admin reference
    await supabaseAdmin
      .from('demo_requests')
      .update({ 
        status: 'approved',
        processed_at: new Date().toISOString(),
        processed_by: user.id,
        message: `CREDENZIALI:\nEmail: ${demoRequest.email}\nPassword: ${password}\nBusiness ID: ${business.id}`
      })
      .eq('id', requestId)

    return NextResponse.json({ 
      success: true,
      businessId: business.id,
      businessName: business.name,
      credentials: {
        email: demoRequest.email,
        password: password,
        slug: slug
      }
    })

  } catch (error: any) {
    console.error('Auto-create instance error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
