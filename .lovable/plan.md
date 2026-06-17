## Problem

The home page's "What does this document mean?" card links to `/help/document`, which is the language-picker + upload page (`src/routes/help.document.tsx`). But clicking it currently shows the `/help` triage cards instead.

Root cause: `src/routes/help.tsx` is a leaf page (renders `HelpPage`, no `<Outlet />`). Because `help.document.tsx` exists as a child, TanStack treats `help.tsx` as a layout — its child route can't mount through it, so the URL changes to `/help/document` but the user still sees the `/help` content.

## Fix

Convert `/help` into a proper layout + index pair so siblings like `/help/document` render correctly.

1. **Create `src/routes/help.index.tsx`** — move the current contents of `help.tsx` here, registered at `createFileRoute("/help/")`. This becomes the page shown at `/help`.
2. **Replace `src/routes/help.tsx`** with a minimal layout route:
   ```tsx
   export const Route = createFileRoute("/help")({
     component: () => <Outlet />,
   });
   ```
3. Leave `help.document.tsx` unchanged — it already has the language selector, consent checkbox, upload, and camera capture flow the user described.

## Verification

- Click the "What does this document mean?" card on the home page → lands on `/help/document` upload page (language dropdown + Upload/Take photo).
- Visiting `/help` directly still shows the six triage cards.
- The other five home-page cards continue deep-linking into `/help?category=...`.
- Run `bun run build:dev` to confirm the route tree regenerates cleanly.
