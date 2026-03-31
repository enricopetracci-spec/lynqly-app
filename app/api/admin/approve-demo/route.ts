import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      return NextResponse.json({ error: 'Config error' }, { status: 500 })
    }

    const { name, email, business_type } = await request.json()

    // Send approval email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Lynqly <onboarding@resend.dev>',
        to: email,
        subject: '🎉 La tua richiesta demo Lynqly è stata approvata!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; }
              .content { background: #f9fafb; padding: 30px 20px; }
              .box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              .button { display: inline-block; background: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 32px;">🎉 Richiesta Approvata!</h1>
              </div>
              <div class="content">
                <p>Ciao <strong>${name}</strong>,</p>
                <p>Ottima notizia! La tua richiesta demo per <strong>${business_type}</strong> è stata approvata!</p>
                
                <div class="box">
                  <h3 style="margin-top: 0; color: #10b981;">📧 Prossimi Passi:</h3>
                  <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>Riceverai a breve un'email con le tue <strong>credenziali di accesso</strong></li>
                    <li>Potrai accedere immediatamente alla piattaforma</li>
                    <li>Avrai <strong>30 giorni di prova gratuita</strong> con tutte le funzionalità</li>
                  </ol>
                </div>

                <div class="box">
                  <h3 style="margin-top: 0; color: #2563eb;">🚀 Cosa puoi fare con Lynqly:</h3>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Gestire prenotazioni online e offline</li>
                    <li>Organizzare anagrafica clienti</li>
                    <li>Creare preventivi professionali</li>
                    <li>Inviare campagne WhatsApp</li>
                    <li>Monitorare statistiche in tempo reale</li>
                  </ul>
                </div>

                <p style="margin-top: 30px;">Se hai domande, rispondi a questa email. Il nostro team è qui per aiutarti!</p>
                
                <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                  <strong>Nota:</strong> Le credenziali arriveranno entro 24 ore.
                </p>
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

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Approval email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
