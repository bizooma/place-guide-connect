## Problem

When you pick a language, the bot's answers translate correctly, but the panel's own copy stays in English:

- Header title "Ask The PLACE"
- Header subtitle "Answers based on our community info"
- Greeting "Hi — I can answer questions about The PLACE…"
- The 4 starter questions ("What classes are offered?", etc.)

Those strings are hardcoded English in `src/components/home/HeroChat.tsx` and are never run through the project's translation layer.

## Fix

Wire `HeroChat.tsx` into the existing `useTranslatedTexts` hook (already used elsewhere in the app — same hook that powers the rest of the dynamic translations). On language change it auto-translates the listed strings via the Lovable AI translate server function and caches per-language in localStorage, so it's instant on repeat visits.

- Collect the 6 source strings (title, subtitle, greeting, 4 starters) and pass them to `useTranslatedTexts`.
- Render each through the returned `tx(...)` lookup so they swap when the language changes.
- The starter buttons still send the **English** source text to the chatbot (the bot already responds in the chosen language, so this keeps retrieval quality high while the user sees the translated label).

No changes to backend, schema, or chat logic — purely a UI translation wiring fix in one file.
