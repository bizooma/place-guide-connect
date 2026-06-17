
CREATE POLICY "Anyone can upload to document-uploads bucket"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'document-uploads');
