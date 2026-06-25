# Support iPhone HEIC photos on /help/document

## Problem
iPhones save photos as HEIC/HEIF. The upload input accepts `.heic`, but the AI (Gemini) and most browsers can't read HEIC, so analysis throws an error.

## Fix
Convert HEIC/HEIF files to JPEG in the browser before uploading, then proceed with the existing upload + analyze flow.

### Steps
1. Add `heic2any` (small client-side HEIC→JPEG converter) as a dependency.
2. In `src/routes/help.document.tsx`, inside `handleFile`:
   - Detect HEIC/HEIF by mime type (`image/heic`, `image/heif`) or file extension (`.heic`, `.heif`).
   - Dynamically `import("heic2any")` (browser-only, avoids SSR issues) and convert to a JPEG `Blob` at quality ~0.9.
   - Wrap the result in a new `File` with a `.jpg` name and `image/jpeg` type, then continue with the existing Supabase upload + `analyzeDocument` call.
   - Show a small "Converting photo…" toast/loading state during conversion.
   - On conversion failure, show a friendly error ("Could not read this iPhone photo — please try saving it as JPEG").
3. Update both file inputs' `accept` to also include `image/heif` for completeness; keep camera capture input unchanged.

### Out of scope
- No server-side conversion, no changes to `analyzeDocument`, no schema/storage changes.
