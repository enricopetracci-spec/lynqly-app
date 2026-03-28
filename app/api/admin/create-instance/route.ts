import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verifica variabili ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing env vars:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!serviceRoleKey 
      })
      return NextResponse.json({ 
        error: 'Configurazione server non valida' 
      }, { status: 500 })
    }

    // Client con Service Role per operazioni admin
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await request.json()
    const { businessName, businessType, ownerEmail, ownerPassword, selectedFeatures } = body

    // 1. Verifica che chi fa la richiesta sia super admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Verifica sia admin
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Non sei super admin' }, { status: 403 })
    }

    // 2. Crea utente con Service Role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 3. Crea slug
    const slug = businessName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // 4. Crea business
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert({
        user_id: authData.user.id,
        name: businessName,
        slug: slug,
        business_type: businessType
      })
      .select()
      .single()

    if (businessError) {
      // Rollback: elimina utente se business fallisce
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: businessError.message }, { status: 400 })
    }

    // 5. Attiva features
    const featuresToInsert = selectedFeatures.map((featureId: string) => ({
      business_id: business.id,
      feature_id: featureId,
      enabled: true
    }))

    const { error: featuresError } = await supabaseAdmin
      .from('business_enabled_features')
      .insert(featuresToInsert)

    if (featuresError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      await supabaseAdmin.from('businesses').delete().eq('id', business.id)
      return NextResponse.json({ error: featuresError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug
      }
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
