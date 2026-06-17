## Goal
Show admins an unread badge on the Requests tab whenever new documents are uploaded, updating live.

## Changes

### 1. Enable realtime on `document_uploads`
Migration:
- `ALTER TABLE public.document_uploads REPLICA IDENTITY FULL;`
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.document_uploads;`

### 2. Badge on Requests tab — `src/routes/_authenticated/admin.tsx`
- Query count of `document_uploads` where `status = 'pending'`.
- Render a small red count badge on the "Requests" `TabsTrigger`.
- `useEffect` subscribes to `postgres_changes` on `document_uploads` (INSERT + UPDATE) and refetches the count; cleanup with `supabase.removeChannel`.

### 3. Live refresh in the list — `src/components/admin/DocumentUploadsList.tsx`
- Same realtime subscription re-runs the existing `load()` so the table updates without a manual refresh.

## Files
- new migration (realtime publication)
- edit `src/routes/_authenticated/admin.tsx`
- edit `src/components/admin/DocumentUploadsList.tsx`
