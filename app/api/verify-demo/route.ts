import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.redirect(new URL('/auth/register?error=config', request.url))
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/auth/register?error=invalid', request.url))
    }

    // Decode token
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [requestId, email] = decoded.split(':')

    if (!requestId || !email) {
      return NextResponse.redirect(new URL('/auth/register?error=invalid', request.url))
    }

    // Update demo request
    const { error } = await supabaseAdmin
      .from('demo_requests')
      .update({ email_verified: true })
      .eq('id', requestId)
      .eq('email', email)

    if (error) throw error

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth/register?verified=true', request.url))

  } catch (error: any) {
    console.error('Verification error:', error)
    return NextResponse.redirect(new URL('/auth/register?error=failed', request.url))
  }
}
