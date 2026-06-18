
-- Update match function to include document title and run accessible to anon
DROP FUNCTION IF EXISTS public.match_chatbot_chunks(vector, integer);

CREATE OR REPLACE FUNCTION public.match_chatbot_chunks(
  query_embedding vector,
  match_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index integer,
  content text,
  similarity double precision,
  document_title text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    c.id,
    c.document_id,
    c.chunk_index,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    d.title AS document_title
  FROM public.chatbot_chunks c
  LEFT JOIN public.chatbot_documents d ON d.id = c.document_id
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_chatbot_chunks(vector, integer) TO anon, authenticated, service_role;

-- Allow anonymous inserts/updates for visitor chat
GRANT INSERT, UPDATE ON public.chatbot_conversations TO anon;
GRANT INSERT ON public.chatbot_messages TO anon;

-- Policies for anon
DROP POLICY IF EXISTS "Anyone can start a conversation" ON public.chatbot_conversations;
CREATE POLICY "Anyone can start a conversation"
ON public.chatbot_conversations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update last_message_at" ON public.chatbot_conversations;
CREATE POLICY "Anyone can update last_message_at"
ON public.chatbot_conversations
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can add chatbot messages" ON public.chatbot_messages;
CREATE POLICY "Anyone can add chatbot messages"
ON public.chatbot_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
