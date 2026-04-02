import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    return NextResponse.json({ 
      error: 'RESEND_API_KEY not configured',
      configured: false 
    })
  }

  try {
    // Test email send
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Lynqly Test <onboarding@resend.dev>',
        to: 'enrico.petracci@gmail.com',
        subject: '🧪 Test Email Lynqly',
        html: '<p>Questa è una email di test per verificare che Resend funzioni!</p>'
      })
    })

    const data = await response.json()

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data: data,
      configured: true
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      configured: true
    }, { status: 500 })
  }
}
