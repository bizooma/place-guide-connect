CREATE POLICY "Anyone can read document-uploads bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'document-uploads');