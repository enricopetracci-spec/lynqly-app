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
 
    // Validate required fields
    if (!name || !email || !phone || !business_type) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }
 
    // Save demo request
    const { data: demoRequest, error: insertError } = await supabaseAdmin
      .from('demo_requests')
      .insert({
        name,
        email,
        phone,
        business_type,
        message: message || null,
        status: 'pending',
        email_verified: false
      })
      .select()
      .single()
 
    if (insertError) throw insertError
 
    // Generate verification token
    const verificationToken = Buffer.from(`${demoRequest.id}:${email}`).toString('base64')
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lynqly-app.vercel.app'}/api/verify-demo?token=${verificationToken}`
 
    // Send verification email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Benvenuto in Lynqly!</h1>
          </div>
          <div class="content">
            <p>Ciao <strong>${name}</strong>,</p>
            <p>Grazie per aver richiesto una demo di Lynqly! Per completare la tua richiesta, conferma il tuo indirizzo email cliccando sul pulsante qui sotto:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Conferma Email</a>
            </div>
            <p>Oppure copia questo link nel browser:</p>
            <p style="background: white; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">${verificationUrl}</p>
            <p><strong>Dettagli della richiesta:</strong></p>
            <ul>
              <li>Nome: ${name}</li>
              <li>Email: ${email}</li>
              <li>Telefono: ${phone}</li>
              <li>Tipo attività: ${business_type}</li>
            </ul>
            <p>Ti ricontatteremo entro 24 ore per attivare il tuo account!</p>
          </div>
          <div class="footer">
            <p>© 2026 Lynqly - Gestione prenotazioni per professionisti</p>
          </div>
        </div>
      </body>
      </html>
    `
 
    // Send email via Supabase Auth (reuses existing email config)
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        custom_email: emailHtml,
        demo_request_id: demoRequest.id
      },
      redirectTo: verificationUrl
    }).catch(() => {
      // Fallback: email not critical for demo request to be saved
      console.log('Email send failed, but request saved')
    })
 
    // Notify admin (you) via email
    const adminEmail = 'enrico.petracci@gmail.com'
    const adminNotificationHtml = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>🔔 Nuova Richiesta Demo</h2>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefono:</strong> ${phone}</p>
        <p><strong>Tipo attività:</strong> ${business_type}</p>
        <p><strong>Messaggio:</strong> ${message || 'Nessun messaggio'}</p>
        <hr>
        <p><a href="https://lynqly-app.vercel.app/admin">Vai al pannello admin</a></p>
      </body>
      </html>
    `
 
    await supabaseAdmin.auth.admin.inviteUserByEmail(adminEmail, {
      data: {
        custom_email: adminNotificationHtml
      }
    }).catch(() => console.log('Admin notification failed'))
 
    return NextResponse.json({ 
      success: true,
      message: 'Richiesta inviata! Controlla la tua email per confermare.'
    })
 
  } catch (error: any) {
    console.error('Demo request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
