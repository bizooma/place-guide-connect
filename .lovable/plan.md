## Problem

"Translate all" fails with: **Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY**.

`translateScheduleAll` in `src/lib/translate.functions.ts` dynamically imports `@/integrations/supabase/client.server`, which throws when `SUPABASE_SERVICE_ROLE_KEY` isn't set in this environment. We don't actually need the service-role client here — the caller is already verified as an admin, and RLS policies on `schedule_items` allow admins to update rows.

This is the same fix pattern we used previously for the chatbot training upload error.

## Fix

In `src/lib/translate.functions.ts`:

1. **`translateScheduleAll`** — remove the `supabaseAdmin` dynamic import. Use the user-scoped `context.supabase` (already auth'd, RLS applies as the admin user) for both the initial select and the per-row updates.
2. **`translateRow`** — same change for consistency, so single-row translate doesn't break for the same reason.

No schema, UI, or RLS changes needed (admins already have update permission on `schedule_items` and `resources`).

## Verification

- Reload admin → Schedule → click "Translate all" → confirm progress completes and rows get translations.
- Click the per-row translate button on one event → confirm it still works.
