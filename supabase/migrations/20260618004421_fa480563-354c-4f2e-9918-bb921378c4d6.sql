GRANT SELECT, INSERT, UPDATE ON public.chatbot_conversations TO anon, authenticated;
GRANT SELECT, INSERT ON public.chatbot_messages TO anon, authenticated;
GRANT SELECT ON public.chatbot_chunks TO anon, authenticated;
GRANT SELECT ON public.chatbot_documents TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_chatbot_chunks(vector, integer) TO anon, authenticated;

-- Allow anon to read back the conversation row they just inserted (needed for .select() after insert)
CREATE POLICY "Anyone can read chatbot conversations"
  ON public.chatbot_conversations FOR SELECT
  TO anon, authenticated
  USING (true);