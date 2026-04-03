import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const resendApiKey = process.env.RESEND_API_KEY

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

    console.log('✅ Demo request saved:', demoRequest.id)

    // Send admin notification email ONLY
    if (resendApiKey) {
      console.log('📧 Sending admin notification...')

      try {
        const adminEmailResponse = await fetch('https://api.resend.com/emails', {
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
              <head>
                <style>
                  body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f9fafb; }
                  .container { max-width: 600px; margin: 0 auto; background: white; }
                  .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center; }
                  .content { padding: 30px 20px; }
                  .info-box { background: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 15px 0; border-radius: 4px; }
                  .info-row { margin: 8px 0; }
                  .label { font-weight: bold; color: #1e40af; }
                  .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 15px; font-weight: bold; }
                  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0; font-size: 24px;">🔔 Nuova Richiesta Demo</h1>
                  </div>
                  <div class="content">
                    <p>Ciao Enrico,</p>
                    <p>È arrivata una nuova richiesta demo da gestire:</p>
                    
                    <div class="info-box">
                      <div class="info-row">
                        <span class="label">👤 Nome:</span> ${name}
                      </div>
                      <div class="info-row">
                        <span class="label">📧 Email:</span> <a href="mailto:${email}">${email}</a>
                      </div>
                      <div class="info-row">
                        <span class="label">📱 Telefono:</span> <a href="tel:${phone}">${phone}</a>
                      </div>
                      <div class="info-row">
                        <span class="label">🏢 Tipo attività:</span> ${business_type}
                      </div>
                      ${message ? `
                      <div class="info-row" style="margin-top: 10px;">
                        <span class="label">💬 Messaggio:</span><br>
                        <span style="color: #374151;">${message}</span>
                      </div>
                      ` : ''}
                    </div>

                    <div style="text-align: center; margin-top: 25px;">
                      <a href="https://lynqly-app.vercel.app/admin/demo-requests" class="button">
                        Gestisci Richiesta →
                      </a>
                    </div>

                    <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
                      💡 <strong>Prossimi passi:</strong><br>
                      1. Verifica i dati del cliente<br>
                      2. Contattalo per conferma<br>
                      3. Approva e crea l'istanza dalla dashboard
                    </p>
                  </div>
                  <div class="footer">
                    <p>© 2026 Lynqly Admin Dashboard</p>
                  </div>
                </div>
              </body>
              </html>
            `
          })
        })

        const adminEmailData = await adminEmailResponse.json()

        if (!adminEmailResponse.ok) {
          console.error('❌ Admin email failed:', adminEmailData)
        } else {
          console.log('✅ Admin email sent:', adminEmailData.id)
        }
      } catch (emailError) {
        console.error('Email error:', emailError)
        // Don't block request if email fails
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
