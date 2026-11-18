
- Job postings sync runs only via secret-protected POST /api/jobs/sync (scheduled externally by pg_cron); page loads never trigger syncs, so stale data cannot cause repeated doomed syncs.
