CREATE POLICY "Admins manage chatbot_chunks" ON public.chatbot_chunks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete document-uploads objects" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'document-uploads' AND public.has_role(auth.uid(), 'admin'));