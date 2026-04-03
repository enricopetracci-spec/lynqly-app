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

    // Send admin notification email
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Lynqly Notifications <onboarding@resend.dev>',
            to: 'enrico.petracci@gmail.com',
            subject: '🔔 Nuova Richiesta Demo Lynqly',
            html: `
              <!DOCTYPE html>
              <html>
              <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #2563eb;">🔔 Nuova Richiesta Demo</h2>
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Nome:</strong> ${name}</p>
                  <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                  <p><strong>Telefono:</strong> <a href="tel:${phone}">${phone}</a></p>
                  <p><strong>Tipo attività:</strong> ${business_type}</p>
                  ${message ? `<p><strong>Messaggio:</strong> ${message}</p>` : ''}
                </div>
                <a href="https://lynqly-app.vercel.app/admin/demo-requests" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 10px;">
                   Gestisci Richieste →
                </a>
              </body>
              </html>
            `
          })
        })
        console.log('✅ Admin notification sent')
      } catch (emailError) {
        console.error('⚠️ Admin email failed (non-critical):', emailError)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Richiesta inviata con successo! Ti contatteremo a breve.'
    })

  } catch (error: any) {
    console.error('💥 Demo request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
