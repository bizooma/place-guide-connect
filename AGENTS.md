
- Job postings sync runs only via secret-protected POST /api/jobs/sync (scheduled externally by pg_cron); page loads never trigger syncs, so stale data cannot cause repeated doomed syncs.
- Server code that needs the service-role key reads it as `SUPABASE_SERVICE_ROLE_KEY ?? PLACE_SERVICE_ROLE_KEY` and builds its own client; the auto-generated `src/integrations/supabase/client.server.ts` reads only the reserved `SUPABASE_` name and can never initialise here, so never route a service-role write through it.
