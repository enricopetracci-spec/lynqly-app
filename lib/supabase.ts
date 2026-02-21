import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipi TypeScript per il database
export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          business_type: string
          description: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          zip_code: string | null
          logo_url: string | null
          cover_image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['businesses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['businesses']['Insert']>
      }
      services: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          duration_minutes: number
          price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['services']['Insert']>
      }
      staff: {
        Row: {
          id: string
          business_id: string
          name: string
          email: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['staff']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['staff']['Insert']>
      }
      customers: {
        Row: {
          id: string
          business_id: string
          name: string
          email: string | null
          phone: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          business_id: string
          customer_id: string
          service_id: string
          staff_id: string | null
          booking_date: string
          booking_time: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          customer_notes: string | null
          internal_notes: string | null
          notification_sent: boolean
          reminder_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
    }
  }
}
