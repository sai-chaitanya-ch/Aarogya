-- Explicitly document that only the backend service-role can manage vector chunks.
-- Anonymous/authenticated API roles also have no table privileges on this table.
DROP POLICY IF EXISTS "aarogya_service_role_manages_document_chunks" ON public.medical_document_chunks;
CREATE POLICY "aarogya_service_role_manages_document_chunks"
ON public.medical_document_chunks
FOR ALL
TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
