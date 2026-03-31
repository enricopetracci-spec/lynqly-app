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

    // Send emails via Resend
    if (resendApiKey) {
      // 1. User verification email
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Lynqly <onboarding@resend.dev>',
          to: email,
          subject: '🎉 Conferma la tua richiesta demo Lynqly',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 40px 20px; text-align: center; }
                .content { background: #f9fafb; padding: 30px 20px; }
                .button { display: inline-block; background: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                .box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🎉 Benvenuto in Lynqly!</h1>
                </div>
                <div class="content">
                  <p>Ciao <strong>${name}</strong>,</p>
                  <p>Grazie per aver richiesto una demo di Lynqly! Per completare la tua richiesta, conferma il tuo indirizzo email:</p>
                  <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">Conferma Email</a>
                  </div>
                  <div class="box">
                    <p style="margin: 5px 0;"><strong>Dettagli richiesta:</strong></p>
                    <p style="margin: 5px 0;">📧 Email: ${email}</p>
                    <p style="margin: 5px 0;">📱 Telefono: ${phone}</p>
                    <p style="margin: 5px 0;">🏢 Tipo attività: ${business_type}</p>
                  </div>
                  <p>Ti ricontatteremo entro <strong>24 ore</strong> per attivare il tuo account!</p>
                </div>
                <div class="footer">
                  <p>© 2026 Lynqly - Gestione prenotazioni per professionisti</p>
                </div>
              </div>
            </body>
            </html>
          `
        })
      })

      // 2. Admin notification
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
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telefono:</strong> ${phone}</p>
                <p><strong>Tipo attività:</strong> ${business_type}</p>
                <p><strong>Messaggio:</strong> ${message || 'Nessun messaggio'}</p>
              </div>
              <a href="https://lynqly-app.vercel.app/admin/demo-requests" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 10px;">Gestisci Richieste Demo</a>
            </body>
            </html>
          `
        })
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Richiesta inviata! Controlla la tua email per confermare.'
    })

  } catch (error: any) {
    console.error('Demo request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
