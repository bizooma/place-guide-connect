## Goal
Remove all dependency on `LOVABLE_API_KEY` so the client pays Google directly via their `GEMINI_API_KEY`. Currently three things still go through Lovable AI Gateway: chat completions, embeddings, and TTS.

## Changes

### 1. `src/lib/chatbot.functions.ts`
- **Embeddings**: replace `openai/text-embedding-3-small` (Lovable Gateway, 1536 dims) with Gemini `text-embedding-004` (Google direct, 768 dims). Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=GEMINI_API_KEY`.
- **Chat answer**: replace gateway `chat/completions` call with a direct Gemini `gemini-2.5-flash:generateContent` call (same pattern already used in `extractTextWithGemini`).
- Remove all `LOVABLE_API_KEY` reads; only `GEMINI_API_KEY` is required.

### 2. `src/routes/api/tts.ts`
- Replace Lovable Gateway TTS with Google Gemini TTS: `gemini-2.5-flash-preview-tts:generateContent` with `responseModalities: ["AUDIO"]`. Returns base64 PCM (24 kHz, 16-bit mono) in the response JSON.
- Update the client `ReadAloudButton` consumer if it depends on the SSE stream shape — switch the endpoint contract to return a single JSON `{ audioBase64, sampleRate }` payload (simpler than SSE) and have the button decode + play it via `AudioContext`. (Will read `ReadAloudButton` first to confirm minimal-impact change.)
- Use `GEMINI_API_KEY`; remove `LOVABLE_API_KEY`.

### 3. Embedding dimension migration (DB)
The `chatbot_chunks.embedding` column is currently `vector(1536)`. Gemini embeddings are 768 dims. Migration required:
- `ALTER TABLE public.chatbot_chunks ALTER COLUMN embedding TYPE vector(768) USING NULL;` (drops existing vectors).
- Update `match_chatbot_chunks(query_embedding vector(768), ...)` to accept 768 dims.
- Drop & recreate the HNSW index on the new column.
- **Any already-ingested documents will need to be re-ingested** (their old 1536-dim vectors are wiped). I'll surface this in the response so you can re-upload the docs in the admin panel.

### 4. Cleanup
- Optionally delete the `LOVABLE_API_KEY` secret afterwards (or leave it — it's free; up to you).

## Notes
- `translate.functions.ts` and `document-ai.functions.ts` already use `GEMINI_API_KEY` directly — no change needed.
- All Google API calls go straight from your server to Google; billing hits the client's Google Cloud account tied to that key.

Confirm and I'll implement.