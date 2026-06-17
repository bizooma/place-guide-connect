# Pre-translated admin content

## Why
Today, translations of resources/schedule items happen in each visitor's browser and are cached only in their own `localStorage`. When an admin adds or edits an item, the new text is re-translated separately for every visitor on first view. We'll move translations server-side so admins can generate them once and all visitors get the same instant result.

## What changes

### Database (migration)
Add a `translations jsonb` column (default `{}`) to:
- `public.resources`
- `public.schedule_items`

Shape: `{ es: { name: "...", description: "...", ... }, ar: {...}, fa: {...}, ps: {...}, so: {...} }`. Only the translatable string fields are stored per language. No new tables, no policy changes.

### Server function
New `translateRow` in `src/lib/translate.functions.ts` (admin-only, gated via `requireSupabaseAuth` + `has_role('admin')`):
- Input: `{ table: 'resources' | 'schedule_items', id: string }`
- Reads the row, calls Gemini (existing `translateBatch` helper) for each of the 5 target languages, writes the merged result back into `translations` using `supabaseAdmin`.
- Returns `{ ok: true, languages: [...] }`.

### Admin UI
In `src/routes/_authenticated/admin.tsx`:
- Replace the static `CrudTable` rows for Resources and Schedule with live data from Supabase.
- Each row gets a "Translate" button (Languages icon). Click → calls `translateRow`, shows spinner, toast on success/failure.
- Row shows a small badge: "Translated" (green) if `translations` covers all 5 langs, "Needs translation" (amber) otherwise — so admins know what to regenerate after an edit.
- Optional bulk "Translate all missing" button at the top of each tab.

### Public pages
`src/routes/resources.tsx` and `src/routes/schedule.tsx`:
- When the active language is not English and the row has a stored `translations[lang]`, use those fields directly.
- Fall back to the existing client-side `tx()` AI translation only when the DB value is missing (keeps things working for un-translated rows).

## Out of scope
- No changes to UI-string locale JSON files.
- No auto-translate-on-save (admin clicks the button explicitly, as requested).
- Triage categories and languages tabs are unchanged (short, already covered by locale files).
