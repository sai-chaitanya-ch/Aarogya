-- =========================================================================
-- Aarogya — Demo Doctor Provisioning Script
-- =========================================================================
-- Objective:
-- Safely link the demo doctor account (doctor@gmail.com) to an unverified
-- doctor profile in `public.doctor_profiles` without weakening RLS or granting
-- unverified access to patient medical records.
--
-- Instructions:
-- 1. Ensure the user 'doctor@gmail.com' has registered in Supabase Auth
--    (via Email signup or Google OAuth).
-- 2. Retrieve their Auth UUID from `auth.users`.
-- 3. Run the following idempotent statement in the Supabase SQL Editor.
-- =========================================================================

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 1. Find user ID for doctor@gmail.com from auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE lower(email) = 'doctor@gmail.com'
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User with email doctor@gmail.com was not found in auth.users. Please create the user account first.';
    ELSE
        -- 2. Upsert demo doctor profile record with explicit unverified status
        -- RLS and application boundaries ensure unverified doctors cannot access patient records.
        INSERT INTO public.doctor_profiles (
            id,
            full_name,
            qualifications,
            specialty,
            registration_number,
            clinic_name,
            clinic_address,
            is_verified,
            updated_at
        )
        VALUES (
            target_user_id,
            'Demo Practitioner (Unverified)',
            'Pending Verification (Demo Account - No Credentials Verified)',
            'General Practice (Unverified)',
            'DEMO-UNVERIFIED-' || UPPER(SUBSTRING(target_user_id::text, 1, 8)),
            'Unverified Practice (Pending Review)',
            'Verification in progress',
            FALSE, -- MUST REMAIN FALSE
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            qualifications = EXCLUDED.qualifications,
            specialty = EXCLUDED.specialty,
            clinic_name = EXCLUDED.clinic_name,
            clinic_address = EXCLUDED.clinic_address,
            is_verified = FALSE, -- Never escalate to verified via demo script
            updated_at = NOW();

        RAISE NOTICE 'Demo doctor profile successfully provisioned for UUID: % (is_verified = FALSE)', target_user_id;
    END IF;
END $$;
