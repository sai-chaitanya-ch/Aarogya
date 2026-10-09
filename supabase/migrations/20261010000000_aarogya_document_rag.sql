-- Aarogya document RAG store. Safe additive migration; does not remove or rewrite existing records.
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.medical_document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.medical_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL CHECK (chunk_index >= 0),
  content text NOT NULL CHECK (length(trim(content)) > 0),
  embedding extensions.vector(768) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);

ALTER TABLE public.medical_document_chunks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.medical_document_chunks FROM anon, authenticated;
GRANT ALL ON public.medical_document_chunks TO service_role;

CREATE INDEX IF NOT EXISTS idx_medical_document_chunks_patient_document
  ON public.medical_document_chunks (patient_id, document_id);
CREATE INDEX IF NOT EXISTS idx_medical_document_chunks_embedding_hnsw
  ON public.medical_document_chunks USING hnsw (embedding extensions.vector_cosine_ops);

CREATE OR REPLACE FUNCTION public.match_aarogya_document_chunks(
  query_embedding extensions.vector(768),
  match_count integer DEFAULT 5,
  min_similarity double precision DEFAULT 0.20,
  filter_patient_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  document_title text,
  document_date date,
  content text,
  similarity double precision
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $function$
  SELECT c.id, c.document_id, d.title, d.visit_date, c.content,
         (1 - (c.embedding <=> query_embedding))::double precision AS similarity
  FROM public.medical_document_chunks AS c
  JOIN public.medical_documents AS d ON d.id = c.document_id
  WHERE c.patient_id = filter_patient_id
    AND filter_patient_id IS NOT NULL
    AND (auth.role() = 'service_role' OR c.patient_id = auth.uid())
    AND (1 - (c.embedding <=> query_embedding)) >= min_similarity
  ORDER BY c.embedding <=> query_embedding
  LIMIT GREATEST(1, LEAST(COALESCE(match_count, 5), 10));
$function$;

REVOKE ALL ON FUNCTION public.match_aarogya_document_chunks(extensions.vector, integer, double precision, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_aarogya_document_chunks(extensions.vector, integer, double precision, uuid) TO service_role;
