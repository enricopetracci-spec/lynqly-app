import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      business_id,
      service_id,
      customer_name,
      customer_email,
      customer_phone,
      booking_date,
      booking_time,
      notes
    } = body

    // Validate required fields
    if (!business_id || !service_id || !customer_name || !customer_email || !booking_date || !booking_time) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      )
    }

    // Verify business exists and is active
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, name')
      .eq('id', business_id)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business non trovato' },
        { status: 404 }
      )
    }

    // Verify service exists and belongs to this business
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('id, name, duration, price')
      .eq('id', service_id)
      .eq('business_id', business_id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Servizio non trovato' },
        { status: 404 }
      )
    }

    // Check if customer exists by email
    let customerId: string

    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('business_id', business_id)
      .eq('email', customer_email)
      .single()

    if (existingCustomer) {
      // Customer exists - update info if needed
      customerId = existingCustomer.id
      
      await supabaseAdmin
        .from('customers')
        .update({
          name: customer_name,
          phone: customer_phone
        })
        .eq('id', customerId)
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          business_id,
          name: customer_name,
          email: customer_email,
          phone: customer_phone
        })
        .select('id')
        .single()

      if (customerError || !newCustomer) {
        return NextResponse.json(
          { error: 'Errore creazione cliente' },
          { status: 500 }
        )
      }

      customerId = newCustomer.id
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        business_id,
        customer_id: customerId,
        service_id,
        booking_date,
        booking_time,
        status: 'pending',
        notes: notes || null
      })
      .select()
      .single()

    if (bookingError || !booking) {
      console.error('Booking error:', bookingError)
      return NextResponse.json(
        { error: 'Errore creazione prenotazione' },
        { status: 500 }
      )
    }

    // TODO: Send confirmation email to customer
    // TODO: Send notification to business owner

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        business_name: business.name,
        service_name: service.name,
        date: booking_date,
        time: booking_time,
        status: booking.status
      }
    })

  } catch (error: any) {
    console.error('Public booking API error:', error)
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    )
  }
}
