-- Aarogya least-privilege client grants.
-- Applied to the Aarogya Supabase project under migration
-- 20261010023704_aarogya_least_privilege_table_grants.
-- Row Level Security policies remain the row-level authorization boundary.

REVOKE ALL PRIVILEGES ON TABLE
  public.profiles,
  public.doctor_profiles,
  public.patient_doctor_relationships,
  public.medical_documents,
  public.medication_reminders,
  public.appointments,
  public.abha_profiles,
  public.medical_document_chunks
FROM anon, authenticated, PUBLIC;

-- Authenticated users can perform ordinary row operations only.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.profiles,
  public.doctor_profiles,
  public.patient_doctor_relationships,
  public.medical_documents,
  public.medication_reminders,
  public.appointments,
  public.abha_profiles
TO authenticated;

-- Anonymous users may view only verified doctor profiles; the existing RLS policy
-- enforces is_verified = true.
GRANT SELECT ON TABLE public.doctor_profiles TO anon;

-- Backend-only access for document indexing and RAG operations.
GRANT ALL PRIVILEGES ON TABLE
  public.profiles,
  public.doctor_profiles,
  public.patient_doctor_relationships,
  public.medical_documents,
  public.medication_reminders,
  public.appointments,
  public.abha_profiles,
  public.medical_document_chunks
TO service_role;

-- All current application tables use UUID defaults, not client-generated sequences.
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, PUBLIC;
