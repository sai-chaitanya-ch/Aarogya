-- =========================================================================
-- Aarogya — PostgreSQL Schema with Row Level Security (RLS)
-- Supabase Auth & Storage Integration
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Patient Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    dob DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    blood_group TEXT,
    phone TEXT,
    location TEXT,
    emergency_contact TEXT,
    allergies TEXT[] DEFAULT '{}',
    conditions TEXT[] DEFAULT '{}',
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'te', 'hi', 'ta')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Doctor Profiles Table
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    qualifications TEXT NOT NULL,
    specialty TEXT NOT NULL,
    registration_number TEXT NOT NULL UNIQUE,
    clinic_name TEXT NOT NULL,
    clinic_address TEXT NOT NULL,
    consultation_hours TEXT,
    consultation_fee NUMERIC(10, 2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT FALSE,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Patient - Doctor Relationships & Authorized Sharing
CREATE TABLE IF NOT EXISTS public.patient_doctor_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
    consent_given_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, doctor_id)
);

-- 4. Medical Documents (Prescriptions, Lab Reports, Discharge Summaries)
CREATE TABLE IF NOT EXISTS public.medical_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('Prescription', 'Lab Report', 'Discharge Summary', 'X-Ray / Imaging', 'Clinical Notes')),
    facility_name TEXT,
    visit_date DATE NOT NULL,
    -- Private Supabase Storage bucket path (e.g. 'user_id/record_uuid.pdf')
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    status TEXT DEFAULT 'verified' CHECK (status IN ('pending_review', 'verified', 'corrected')),
    -- AI Generated Explanations & Extracted Structured Data (JSONB)
    ai_summary JSONB DEFAULT '{}'::jsonb,
    extracted_fields JSONB DEFAULT '{}'::jsonb,
    review_alerts TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Active Medication Reminders
CREATE TABLE IF NOT EXISTS public.medication_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES public.medical_documents(id) ON DELETE SET NULL,
    medicine_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    instructions TEXT,
    time_slot TEXT NOT NULL, -- e.g. '08:00 AM'
    slot_name TEXT NOT NULL CHECK (slot_name IN ('Morning', 'Afternoon', 'Evening', 'Night')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'skipped')),
    taken_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    consultation_type TEXT DEFAULT 'In-person' CHECK (consultation_type IN ('In-person', 'Teleconsultation')),
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
    clinical_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ABHA / ABDM Connection
CREATE TABLE IF NOT EXISTS public.abha_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    abha_number TEXT NOT NULL, -- 14-digit ABHA
    abha_address TEXT NOT NULL, -- e.g. name@abdm
    linked_via TEXT CHECK (linked_via IN ('abha', 'aadhaar', 'phone')),
    consent_recorded BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_doctor_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abha_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: Patients can only view and update their own profile
CREATE POLICY "Users can manage own profile"
    ON public.profiles
    FOR ALL
    USING (auth.uid() = id);

-- Doctor Profiles: Publicly viewable for booking, doctors can update their own
CREATE POLICY "Anyone can view doctor profiles"
    ON public.doctor_profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Doctors can manage own profile"
    ON public.doctor_profiles
    FOR ALL
    USING (auth.uid() = id);

-- Relationships: Patient or Doctor involved can view
CREATE POLICY "Patients and doctors can view relationships"
    ON public.patient_doctor_relationships
    FOR ALL
    USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Medical Documents RLS:
-- 1. Patient can view and manage their own documents
CREATE POLICY "Patients can manage own documents"
    ON public.medical_documents
    FOR ALL
    USING (auth.uid() = patient_id);

-- 2. Authorized Doctors can view linked patients' documents
CREATE POLICY "Authorized doctors can view patient documents"
    ON public.medical_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_doctor_relationships
            WHERE doctor_id = auth.uid()
            AND patient_id = public.medical_documents.patient_id
            AND status = 'active'
        )
    );

-- Reminders: Patients can manage their own reminders
CREATE POLICY "Patients can manage own medication reminders"
    ON public.medication_reminders
    FOR ALL
    USING (auth.uid() = patient_id);

-- Appointments: Patient or Doctor can view and manage their appointments
CREATE POLICY "Patients and Doctors can access their appointments"
    ON public.appointments
    FOR ALL
    USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- ABHA Profiles: Only the owning patient can view
CREATE POLICY "Patients can manage own ABHA"
    ON public.abha_profiles
    FOR ALL
    USING (auth.uid() = patient_id);

-- =========================================================================
-- PRIVATE SUPABASE STORAGE BUCKET CONFIGURATION
-- =========================================================================

-- Create private bucket for medical records (if not already created)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'medical-records',
    'medical-records',
    false, -- PRIVATE BUCKET: Requires signed URLs!
    20971520, -- 20 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage RLS: Users can only upload and read files within their own folder: user_id/*
CREATE POLICY "Users can upload their own medical documents"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'medical-records' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can read their own medical documents via signed URL"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'medical-records' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
