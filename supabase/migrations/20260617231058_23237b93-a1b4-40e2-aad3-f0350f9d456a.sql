CREATE POLICY "Admins can view all document uploads"
ON public.document_uploads FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update document uploads"
ON public.document_uploads FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read document-uploads objects"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'document-uploads' AND public.has_role(auth.uid(), 'admin'));