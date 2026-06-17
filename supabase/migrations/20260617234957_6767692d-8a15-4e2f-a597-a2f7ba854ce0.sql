
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================
-- chatbot_documents
-- =========================
CREATE TABLE public.chatbot_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source_filename text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  byte_size bigint,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','ready','error')),
  error_message text,
  chunk_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chatbot_documents TO authenticated;
GRANT ALL ON public.chatbot_documents TO service_role;

ALTER TABLE public.chatbot_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chatbot_documents"
  ON public.chatbot_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_chatbot_documents_updated_at
  BEFORE UPDATE ON public.chatbot_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- chatbot_chunks (1536 dims = openai text-embedding-3-small; supports HNSW)
-- =========================
CREATE TABLE public.chatbot_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.chatbot_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  token_estimate integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.chatbot_chunks TO service_role;
-- No grants for anon/authenticated: server-only.

ALTER TABLE public.chatbot_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read chatbot_chunks"
  ON public.chatbot_chunks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX chatbot_chunks_embedding_idx
  ON public.chatbot_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX chatbot_chunks_document_id_idx
  ON public.chatbot_chunks (document_id);

-- =========================
-- chatbot_conversations
-- =========================
CREATE TABLE public.chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  visitor_label text,
  message_count integer NOT NULL DEFAULT 0
);

GRANT SELECT ON public.chatbot_conversations TO authenticated;
GRANT ALL ON public.chatbot_conversations TO service_role;

ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read chatbot_conversations"
  ON public.chatbot_conversations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- chatbot_messages
-- =========================
CREATE TABLE public.chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.chatbot_messages TO authenticated;
GRANT ALL ON public.chatbot_messages TO service_role;

ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read chatbot_messages"
  ON public.chatbot_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX chatbot_messages_conversation_idx
  ON public.chatbot_messages (conversation_id, created_at);

-- =========================
-- match function (called by service_role server fn)
-- =========================
CREATE OR REPLACE FUNCTION public.match_chatbot_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index integer,
  content text,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.document_id,
    c.chunk_index,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.chatbot_chunks c
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

REVOKE ALL ON FUNCTION public.match_chatbot_chunks(vector, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_chatbot_chunks(vector, int) TO service_role;
