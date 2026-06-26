## Goal
Revert translation back to direct Gemini API (using the client's `GEMINI_API_KEY`) and record a persistent rule so future changes don't swap to the Lovable AI Gateway.

## Changes

1. **`src/lib/translate.functions.ts`** — restore the direct Gemini call:
   - Read `process.env.GEMINI_API_KEY` (not `LOVABLE_API_KEY`).
   - POST to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=...`.
   - Keep the existing retry/backoff on 429/503/5xx and the JSON `response_schema` shape.
   - Parse `candidates[0].content.parts[0].text` into `{ translations: string[] }`.

2. **`mem://index.md`** — add a Core rule:
   > Translations and all app-runtime AI calls use the direct provider API (e.g. Gemini via `GEMINI_API_KEY`). Never switch to Lovable AI Gateway — the client supplies their own keys at launch.

## Notes on the 429
The original error was the direct Gemini free-tier quota. After reverting, that key will still 429 if the project key is on the free tier. The existing exponential-backoff retry stays in place; long-term fix is the client's paid key at launch.
