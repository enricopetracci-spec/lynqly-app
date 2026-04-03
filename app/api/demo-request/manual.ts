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

    const { name, email, phone, business_type, message } = await request.json()

    // Validate
    if (!name || !email || !phone || !business_type) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    // Save demo request with email_verified = true (manual verification)
    const { data: demoRequest, error: insertError } = await supabaseAdmin
      .from('demo_requests')
      .insert({
        name,
        email,
        phone,
        business_type,
        message: message || null,
        status: 'pending',
        email_verified: true  // Auto-verified for manual workflow
      })
      .select()
      .single()

    if (insertError) {
      console.error('DB Insert Error:', insertError)
      throw insertError
    }

    console.log('✅ Demo request saved (manual verification):', demoRequest.id)

    return NextResponse.json({ 
      success: true,
      message: 'Richiesta inviata con successo! Ti contatteremo a breve.'
    })

  } catch (error: any) {
    console.error('💥 Demo request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
