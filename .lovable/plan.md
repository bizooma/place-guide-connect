## Goal
Make the admin Settings tab functional. Start with a single editable field — **Support email** — designed so more settings drop in later without schema churn.

## Database
New migration creating a key/value settings table (flexible for future fields):

- `public.app_settings`
  - `key text PRIMARY KEY`
  - `value jsonb NOT NULL`
  - `updated_at timestamptz NOT NULL DEFAULT now()`
  - `updated_by uuid` (nullable)
- Grants: `SELECT` to `anon, authenticated`; `ALL` to `service_role`; `INSERT/UPDATE/DELETE` to `authenticated`.
- RLS enabled. Policies:
  - SELECT: public read (so the support email can be shown on the site).
  - INSERT/UPDATE/DELETE: `has_role(auth.uid(), 'admin')`.
- `updated_at` trigger using existing `public.set_updated_at()`.
- Seed row: `('support_email', '""'::jsonb)`.

## Frontend
- New `src/components/admin/SettingsEditor.tsx`:
  - Loads `app_settings` row where `key='support_email'`.
  - Single labeled input (type=email) + Save button.
  - Upserts on save with `updated_by = auth.uid()`, toasts success/error.
  - Layout leaves room for additional setting cards later (one section per setting).
- `src/routes/_authenticated/admin.tsx`: replace the empty `EmptyState` in the Settings tab with `<SettingsEditor />`.

## Out of scope
- No surfacing of the support email on public pages yet (can wire into footer/contact later).
- No additional setting fields yet — structure supports them when requested.
