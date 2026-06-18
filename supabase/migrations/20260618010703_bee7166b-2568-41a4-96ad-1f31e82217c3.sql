DROP INDEX IF EXISTS public.chatbot_chunks_embedding_idx;
ALTER TABLE public.chatbot_chunks ALTER COLUMN embedding TYPE vector(768) USING NULL;
DELETE FROM public.chatbot_chunks;
UPDATE public.chatbot_documents SET status = 'error', error_message = 'Re-ingest required after embedding model change', chunk_count = 0 WHERE status = 'ready';
CREATE INDEX chatbot_chunks_embedding_idx ON public.chatbot_chunks USING hnsw (embedding vector_cosine_ops);

DROP FUNCTION IF EXISTS public.match_chatbot_chunks(vector, integer);
CREATE OR REPLACE FUNCTION public.match_chatbot_chunks(query_embedding vector(768), match_count integer DEFAULT 5)
RETURNS TABLE(id uuid, document_id uuid, chunk_index integer, content text, similarity double precision, document_title text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT c.id, c.document_id, c.chunk_index, c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    d.title AS document_title
  FROM public.chatbot_chunks c
  LEFT JOIN public.chatbot_documents d ON d.id = c.document_id
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
GRANT EXECUTE ON FUNCTION public.match_chatbot_chunks(vector, integer) TO anon, authenticated;