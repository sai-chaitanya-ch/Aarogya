-- Aarogya database performance and RLS policy cleanup.
-- Applied to the Aarogya Supabase project under migration
-- 20261010023952_aarogya_query_performance_and_rls_policy.

CREATE INDEX IF NOT EXISTS idx_medical_documents_doctor_id
  ON public.medical_documents (doctor_id);

CREATE INDEX IF NOT EXISTS idx_medication_reminders_prescription_id
  ON public.medication_reminders (prescription_id);

DROP POLICY IF EXISTS aarogya_service_role_manages_document_chunks
  ON public.medical_document_chunks;

CREATE POLICY aarogya_service_role_manages_document_chunks
  ON public.medical_document_chunks
  FOR ALL
  TO service_role
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');
