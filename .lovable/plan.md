
## Goal

When someone uploads a document on `/help/document`, call Google Gemini directly (using your `GEMINI_API_KEY`) to parse it and produce a plain-language explanation in the language they pick, then read it aloud in that language.

Using Gemini directly (not the Lovable AI Gateway) so the key can be swapped to the client's own key at launch — they'll handle Google billing directly.

## Secrets

Add one new secret: `GEMINI_API_KEY` (server-only, never exposed to the browser). I'll request it via the secret tool after you approve the plan.

## UX changes (`src/routes/help.document.tsx`)

1. Add a **language selector** above the consent checkbox, defaulting to the user's current site language (`useI18n`). Options match existing `src/locales/*`: English, Spanish, plus the three additional locales (lang2/3/4/5 — I'll label them with their real names; tell me if you want a specific set).
2. After upload succeeds, call a new server function `analyzeDocument` with `{ storagePath, mimeType, language }`. Show "Reading your document…" while it runs.
3. Render the AI result in the existing result cards (kind, summary, important, dates, next steps, contact) — all text in the chosen language.
4. The existing `ReadAloudButton` is swapped to stream TTS audio in the selected language (see below).

## Server work

### 1. `src/lib/document-ai.functions.ts` — `analyzeDocument`

`createServerFn({ method: "POST" })` with zod input validation.

- Load `supabaseAdmin` inside the handler, download the file from the `document-uploads` bucket, base64-encode it.
- POST to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}` with:
  - `contents`: a user turn containing an `inline_data` part (the file bytes + mimeType) and a text part with the user's request.
  - `system_instruction`: "Explain this document in plain, simple {language}. Be warm, non-judgmental. Output strict JSON matching the schema."
  - `generationConfig.responseMimeType: "application/json"` and `responseSchema` describing `{ kind, summary, important[], dates[], nextSteps[], contact }`.
- Parse and return the JSON. Map 429/quota errors to a friendly message.
- Cap file size at 10 MB; reject other mime types.

### 2. `src/routes/api/tts.ts` — TTS server route

Gemini 2.5's TTS models (`gemini-2.5-flash-preview-tts`) return PCM audio and support natural multilingual speech via prompt steering.

- POST `{ text, language }`. Calls `gemini-2.5-flash-preview-tts` with `responseModalities: ["AUDIO"]` and a prebuilt voice (e.g. `Kore`). The prompt prefixes "Read the following naturally in {language}: …".
- Decode the returned base64 PCM, wrap as a WAV (24kHz, 16-bit mono), and return it as `audio/wav`. Simple, no streaming complexity, plays in any `<audio>` element.

### 3. `src/components/ReadAloudButton.tsx`

Rewrite to POST to `/api/tts` with `{ text, language }`, set the returned blob as the `src` of an `Audio` element, and play. Accepts a `language` prop; the document page passes the selected language. Falls back to the existing `speechSynthesis` path if the fetch fails.

## Files touched

- edit `src/routes/help.document.tsx` (language selector, real AI call replacing the hard-coded `FakeResult`, pass language to `ReadAloudButton`)
- new `src/lib/document-ai.functions.ts`
- new `src/routes/api/tts.ts`
- rewrite `src/components/ReadAloudButton.tsx`

## At client handoff

Swap the value of `GEMINI_API_KEY` to the client's key in project settings — no code change needed. Billing then flows to their Google Cloud account.
