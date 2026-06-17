ALTER TABLE public.document_uploads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_uploads;