The 6 triage cards on the home page already have glassmorphic Tailwind classes (`bg-white/40 backdrop-blur-xl border border-white/50 hover:bg-white/60`), but the `surface-card` CSS utility overrides them due to equal specificity and later source order. To fix this:

1. Remove the `surface-card` class from each of the 6 card `<Link>` elements in `src/routes/index.tsx`.
2. Add `rounded-2xl shadow-card` directly to the className so the cards keep their rounded corners and drop shadow.
3. Verify in the preview that the frosty semi-transparent background with backdrop blur appears correctly.