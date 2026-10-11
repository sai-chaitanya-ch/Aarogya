-- Aarogya Security Hardening: Restrictive RLS Policies for Authenticated Anonymous Sessions.
-- Migration: 20261011140000_aarogya_anonymous_session_rls_hardening.sql
--
-- Objective:
-- Ensure authenticated sessions with an anonymous Supabase JWT ('is_anonymous' = true)
-- cannot read, insert, update, or delete any persistent production data across medical
-- tables, relationships, profiles, or storage objects.
--
-- By defining these policies AS RESTRICTIVE on role 'authenticated', PostgreSQL evaluates
-- them in conjunction with all existing permissive policies (using AND). If a JWT possesses
-- the claim 'is_anonymous' = true, the condition evaluates to FALSE, rejecting the operation.
--
-- Ordinary authenticated users (where 'is_anonymous' is false or absent) evaluate to TRUE,
-- preserving their existing permissions unchanged.
--
-- Backend operations using the 'service_role' key bypass RLS or connect as role 'service_role',
-- and are entirely unaffected.

-- 1. Profiles
DROP POLICY IF EXISTS aarogya_restrict_anonymous_profiles ON public.profiles;
CREATE POLICY aarogya_restrict_anonymous_profiles
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false)
WITH CHECK (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);

-- 2. Doctor Profiles
DROP POLICY IF EXISTS aarogya_restrict_anonymous_doctor_profiles ON public.doctor_profiles;
CREATE POLICY aarogya_restrict_anonymous_doctor_profiles
ON public.doctor_profiles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false)
WITH CHECK (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);

-- 3. Patient - Doctor Relationships
DROP POLICY IF EXISTS aarogya_restrict_anonymous_patient_doctor_relationships ON public.patient_doctor_relationships;
CREATE POLICY aarogya_restrict_anonymous_patient_doctor_relationships
ON public.patient_doctor_relationships
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false)
WITH CHECK (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);

-- 4. Medical Documents
DROP POLICY IF EXISTS aarogya_restrict_anonymous_medical_documents ON public.medical_documents;
CREATE POLICY aarogya_restrict_anonymous_medical_documents
ON public.medical_documents
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false)
WITH CHECK (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);

-- 5. Medication Reminders
DROP POLICY IF EXISTS aarogya_restrict_anonymous_medication_reminders ON public.medication_reminders;
CREATE POLICY aarogya_restrict_anonymous_medication_reminders
ON public.medication_reminders
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false)
WITH CHECK (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);

-- 6. Appointments
DROP POLICY IF EXISTS aarogya_restrict_anonymous_appointments ON public.appointments;
CREATE POLICY aarogya_restrict_anonymous_appointments
ON public.appointments
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false)
WITH CHECK (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);

-- 7. ABHA Profiles
DROP POLICY IF EXISTS aarogya_restrict_anonymous_abha_profiles ON public.abha_profiles;
CREATE POLICY aarogya_restrict_anonymous_abha_profiles
ON public.abha_profiles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false)
WITH CHECK (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);

-- 8. Storage Objects (Private Medical Records and Document Uploads)
DROP POLICY IF EXISTS aarogya_restrict_anonymous_storage_objects ON storage.objects;
CREATE POLICY aarogya_restrict_anonymous_storage_objects
ON storage.objects
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false)
WITH CHECK (coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);
