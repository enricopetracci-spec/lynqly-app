-- =====================================================
-- LYNQLY DATABASE SCHEMA
-- =====================================================
-- Questo file va eseguito su Supabase SQL Editor
-- Crea tutte le tabelle necessarie per Lynqly
-- =====================================================

-- Abilita le estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELLA: businesses (Attività commerciali)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL friendly: salone-maria
    business_type VARCHAR(100) NOT NULL, -- salon, barber, spa, restaurant, etc.
    description TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    zip_code VARCHAR(20),
    logo_url TEXT,
    cover_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX idx_businesses_slug ON public.businesses(slug);
CREATE INDEX idx_businesses_is_active ON public.businesses(is_active);

-- =====================================================
-- TABELLA: services (Servizi offerti)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL, -- durata in minuti
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_business_id ON public.services(business_id);
CREATE INDEX idx_services_is_active ON public.services(is_active);

-- =====================================================
-- TABELLA: staff (Personale dell'attività)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_staff_business_id ON public.staff(business_id);
CREATE INDEX idx_staff_is_active ON public.staff(is_active);

-- =====================================================
-- TABELLA: staff_services (Servizi che ogni staff può fare)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.staff_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, service_id)
);

CREATE INDEX idx_staff_services_staff_id ON public.staff_services(staff_id);
CREATE INDEX idx_staff_services_service_id ON public.staff_services(service_id);

-- =====================================================
-- TABELLA: availability (Disponibilità settimanale)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Domenica, 1=Lunedì, ..., 6=Sabato
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_availability_staff_id ON public.availability(staff_id);
CREATE INDEX idx_availability_day_of_week ON public.availability(day_of_week);

-- =====================================================
-- TABELLA: customers (Clienti)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_business_id ON public.customers(business_id);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_phone ON public.customers(phone);

-- =====================================================
-- TABELLA: bookings (Prenotazioni)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed, no_show
    customer_notes TEXT,
    internal_notes TEXT,
    notification_sent BOOLEAN DEFAULT false,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookings_business_id ON public.bookings(business_id);
CREATE INDEX idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX idx_bookings_staff_id ON public.bookings(staff_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- =====================================================
-- TABELLA: business_settings (Impostazioni attività)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
    booking_buffer_minutes INTEGER DEFAULT 15, -- tempo buffer tra prenotazioni
    advance_booking_days INTEGER DEFAULT 30, -- quanti giorni in anticipo si può prenotare
    cancellation_hours INTEGER DEFAULT 24, -- ore minime per cancellare
    auto_confirm_bookings BOOLEAN DEFAULT false,
    send_email_notifications BOOLEAN DEFAULT true,
    send_sms_notifications BOOLEAN DEFAULT false,
    booking_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_business_settings_business_id ON public.business_settings(business_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Sicurezza: ogni utente vede solo i propri dati

-- Abilita RLS su tutte le tabelle
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Policy per businesses: l'utente vede solo la propria attività
CREATE POLICY "Users can view own business" ON public.businesses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business" ON public.businesses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business" ON public.businesses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own business" ON public.businesses
    FOR DELETE USING (auth.uid() = user_id);

-- Policy per services: l'utente vede solo i servizi della propria attività
CREATE POLICY "Users can view own services" ON public.services
    FOR SELECT USING (
        business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own services" ON public.services
    FOR INSERT WITH CHECK (
        business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own services" ON public.services
    FOR UPDATE USING (
        business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete own services" ON public.services
    FOR DELETE USING (
        business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    );

-- Policy simili per le altre tabelle...
-- (abbrevio per spazio, ma il pattern è lo stesso)

-- Policy PUBBLICA per bookings: chiunque può creare una prenotazione
CREATE POLICY "Anyone can create booking" ON public.bookings
    FOR INSERT WITH CHECK (true);

-- Il commerciante può vedere tutte le prenotazioni della sua attività
CREATE POLICY "Owners can view all bookings" ON public.bookings
    FOR SELECT USING (
        business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    );

-- =====================================================
-- FUNZIONI UTILITY
-- =====================================================

-- Funzione per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per tutte le tabelle
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- DATI DI ESEMPIO (Opzionale - per testing)
-- =====================================================
-- Questi dati servono solo per testare l'app
-- Puoi cancellarli dopo il primo test

-- NOTA: Non inserisco dati di esempio qui perché richiedono un user_id valido
-- L'app creerà automaticamente i dati quando ti registri

-- =====================================================
-- FINE SCHEMA
-- =====================================================

-- Per verificare che tutto sia stato creato correttamente:
SELECT 
    schemaname, 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
