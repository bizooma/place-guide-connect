
## Goal

Add an AI chatbot embedded into the home page using a split-hero layout (marketing left, live chat right), answering strictly from admin-uploaded training documents (RAG). Add a new "Training Docs" tab in the admin dashboard for managing the knowledge base. Persist all conversations in the database for admin review.

## Home page — split hero

Replace the current single-column hero with a two-column layout:

- **Left column** — existing tagline, subtitle, "Get help" / "View schedule" / Install buttons, "Inspired by The PLACE" chip. Slightly tightened.
- **Right column** — embedded chat card (frosted surface over hero bg):
  - Header with assistant name + small "Answers from PLACE info" subtitle
  - Message transcript built from AI Elements (`Conversation`, `Message`, `MessageResponse`, `Shimmer`)
  - 3–4 starter prompt chips ("What classes are offered?", "How do I get help with a bill?", "What hours are you open?", "Where are you located?")
  - `PromptInput` composer at the bottom with submit button
  - When the model can't find an answer in docs, it replies with a gentle "I don't have that in my notes yet — try the Get Help button" message
- Below the hero, triage cards section remains unchanged.

The cards/disclaimer sections below the hero stay as-is.

## Backend — RAG pipeline

**Storage of training material**

New table `chatbot_documents`:
- `title`, `source_filename`, `storage_path`, `mime_type`, `byte_size`, `status` (`processing` | `ready` | `error`), `error_message`, `chunk_count`
- RLS: admin-only read/write; service role full

New table `chatbot_chunks`:
- `document_id` (FK → chatbot_documents, cascade delete)
- `chunk_index`, `content` (text), `embedding` (vector(3072)), `token_estimate`
- HNSW index on `embedding` with `vector_cosine_ops`
- RLS: no client access; service role only (queried from server functions)

New Supabase Storage bucket `chatbot-training` (private). Admin uploads land here.

**Conversation persistence**

New table `chatbot_conversations`:
- `id`, `started_at`, `last_message_at`, `visitor_label` (nullable — short auto label derived from first question), `message_count`
- RLS: admin select; anon insert allowed (returns the id); anon update only own row via id passed back through chat requests; service role full

New table `chatbot_messages`:
- `conversation_id` (FK cascade), `role` (`user` | `assistant`), `content` (text), `created_at`, `sources` (jsonb array of {document_id, title, snippet} for assistant messages)
- RLS: admin select; service role full; no direct client writes (all writes happen server-side via the chat server fn)

`pgvector` extension enabled. A `match_chatbot_chunks(query_embedding, match_count)` SQL function returns top-k chunks with similarity.

**Server functions** (`src/lib/chatbot.functions.ts`)

- `ingestChatbotDocument({ documentId })` — admin-only. Downloads the file from storage, extracts text (PDF/DOCX/TXT/MD), splits into ~1000-char chunks with overlap, embeds each via Lovable AI (`google/gemini-embedding-001`), inserts chunks, marks document `ready` (or `error` with message).
- `deleteChatbotDocument({ documentId })` — admin-only. Removes storage file + cascades chunks.
- `askChatbot({ conversationId?, question })` — public (no auth required for the visitor):
  1. If no `conversationId`, create a row in `chatbot_conversations` and return the new id alongside the answer.
  2. Embed the question, call `match_chatbot_chunks` (top 5).
  3. If no chunks above similarity threshold → save assistant message "I don't have that info yet" with empty sources.
  4. Otherwise call Lovable AI chat (`google/gemini-3-flash-preview`) with a strict system prompt: "Answer only from the provided context. If insufficient, say you don't know." Include the chunks as context.
  5. Persist user message + assistant message (with `sources`), bump `last_message_at` + `message_count`.
  6. Return `{ conversationId, answer, sources }`.

The chat call is non-streaming for simplicity (one server-fn call per turn). If streaming is later desired we can add a `/api/chat` server route.

## Admin — Training Docs tab

New `<TrainingDocsEditor />` mounted in admin under a new tab "Training" (icon: `BookOpenText` or `Brain`). Tab order: Help choices, Schedule, Resources, Requests, **Training**, Languages, Settings.

Editor sections:
1. **Upload** — file input (PDF, DOCX, TXT, MD; max 10 MB) + optional title field. On upload: file goes to `chatbot-training` bucket, row inserted with `status='processing'`, then `ingestChatbotDocument` runs. UI polls/refreshes until `ready` or `error`.
2. **Documents list** — table of all docs: title, filename, size, status badge, chunk count, uploaded date, delete button. Error rows show the `error_message`.
3. **Conversations** (bonus, same tab, collapsed by default) — list of recent visitor conversations with first question preview + message count + timestamp; clicking expands inline to show the full transcript so admins can spot gaps in training.

## Frontend pieces

New files:
- `src/components/home/HeroChat.tsx` — the embedded chat card (uses AI Elements installed via `bun x ai-elements@latest add conversation message prompt-input shimmer`).
- `src/hooks/useChatbot.ts` — manages `conversationId` (kept in `sessionStorage` so a refresh keeps the same convo), messages state, and calls `askChatbot`.
- `src/components/admin/TrainingDocsEditor.tsx` — admin UI described above.

Edited files:
- `src/routes/index.tsx` — split hero layout.
- `src/routes/_authenticated/admin.tsx` — add Training tab.

## Out of scope

- Streaming responses (can be added later via a server route).
- Multilingual chat answers (will respond in whatever language the user writes, but no per-language doc routing).
- Visitor authentication / per-user conversation history (visitors are anonymous; conversation id lives in sessionStorage).
- Auto re-embedding when docs change (admin re-uploads to refresh).

## Technical details

- Embeddings: `google/gemini-embedding-001` (3072 dims), `vector(3072)` column, HNSW cosine index.
- Chat model: `google/gemini-3-flash-preview` via Lovable AI Gateway, server-only key.
- PDF/DOCX parsing inside the ingest server fn: use lightweight pure-JS libraries (`pdfjs-dist` legacy build for PDFs, `mammoth` for DOCX). If a Worker-runtime incompatibility shows up at build, fall back to text/markdown only and surface a clear "unsupported file type" message; we'll add a parser-friendly approach in a follow-up.
- All Supabase writes to `chatbot_chunks` / `chatbot_messages` happen through server functions using the admin client loaded inside the handler (`await import('@/integrations/supabase/client.server')`), with admin gating via `has_role` for ingest/delete and no auth for `askChatbot`.
- `askChatbot` rate-limits per `conversationId` (simple in-memory token bucket is fragile on serverless — instead we cap to 1 in-flight request per conversation on the client and rely on Lovable AI's per-workspace rate limit server-side; if abuse becomes an issue we add a `chatbot_rate_limits` table).
