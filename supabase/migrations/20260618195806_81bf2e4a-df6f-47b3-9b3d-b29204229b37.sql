
CREATE POLICY "Anyone can delete a document upload"
ON public.document_uploads
FOR DELETE
TO anon, authenticated
USING (true);

GRANT DELETE ON public.document_uploads TO anon;

CREATE POLICY "Anyone can delete document-uploads objects"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'document-uploads');
