-- 1. Remove public read of document-uploads bucket
DROP POLICY IF EXISTS "Anyone can read document-uploads bucket" ON storage.objects;

-- 2. Remove wide-open delete policies
DROP POLICY IF EXISTS "Anyone can delete document-uploads objects" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete a document upload" ON public.document_uploads;
REVOKE DELETE ON public.document_uploads FROM anon;

-- 3. Scoped delete via SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.delete_document_upload(upload_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path text;
BEGIN
  DELETE FROM public.document_uploads
  WHERE id = upload_id
  RETURNING storage_path INTO v_path;

  IF v_path IS NOT NULL THEN
    DELETE FROM storage.objects
    WHERE bucket_id = 'document-uploads' AND name = v_path;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_document_upload(uuid) TO anon, authenticated;

-- 4. Per-IP rate limiting for AI endpoints (server-side only)
CREATE TABLE IF NOT EXISTS public.ai_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1
);

GRANT ALL ON public.ai_rate_limit TO service_role;

ALTER TABLE public.ai_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS ai_rate_limit_lookup_idx
  ON public.ai_rate_limit (ip_hash, endpoint, window_start);