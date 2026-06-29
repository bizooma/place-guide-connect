## Resources page card redesign

### Layout
Switch the grid from 3-up uniform cards to a 2-up split layout on desktop (sm:grid-cols-2, lg:grid-cols-2 with wider cards) so each card can hold an image + content side-by-side. On mobile the card stacks (image on top, content below).

Card structure (desktop):
```
┌──────────────┬─────────────────────────────┐
│              │ CATEGORY chip               │
│   image      │ Resource name (display)     │
│   ~40% width │ Description                 │
│   full bleed │ ── divider ──               │
│              │ hours · address · langs     │
│              │ [Call] [Website] [Directions]│
└──────────────┴─────────────────────────────┘
```

### Imagery
Generate ~10 themed photos, one per category, warm/editorial style matching the cream + terracotta + forest-green palette. Categories observed: Housing, Food, Tax Assistance, Transportation, Government Services, Legal Help, Jobs, Health, Education, Other (fallback). Stored as Lovable Assets and mapped by `resource.category` in a `categoryImage` lookup. Image uses `object-cover`, full height of the card, with a subtle terracotta gradient overlay at the bottom-left so the CATEGORY chip stays legible.

### Visual polish
- Card: `surface-card` base, rounded-3xl, overflow-hidden, border refined to `border-border/60`, shadow upgraded to `shadow-lift` on hover.
- Hover: `group` wrapper — card translates up 2px, shadow deepens, image scales 1.05 over 500ms ease-out.
- Category chip: small pill overlaid on the image (top-left), backdrop-blur, bg-background/80, accent text.
- Typography: name uses font-display (Fraunces) at text-2xl; description clamped to 3 lines (`line-clamp-3`) for visual consistency.
- Meta row: icon + text pairs (Clock, MapPin, Languages, DollarSign) instead of plain lines — denser and more scannable.
- Buttons: primary Call button stays filled green; Website/Directions become ghost+icon for less visual noise.

### Mobile quick-call FAB
When a card has a phone number, on screens < sm show a floating circular call button anchored to the bottom-right of the card image area (absolute positioning, h-12 w-12, bg-primary, shadow-lift). Tapping calls `tel:`. Hidden on sm+ since the inline Call button is already prominent there.

### Section header refresh
Above the grid, keep the existing search/filters but restyle them into a single unified rounded-3xl "control bar" with the search inline with the two selects, so the new card grid has a stronger anchor above it.

### Files
- `src/routes/resources.tsx` — rewrite the card markup, swap grid to 2-up, add category→image lookup, integrate FAB, restyle filter bar. The Ronny Jackson section stays as-is (already its own treatment).
- `src/assets/resource-categories/<slug>.jpg.asset.json` × ~10 — new generated photos uploaded via `lovable-assets`.
- `src/styles.css` — add a `line-clamp-3` safety + a small `@utility resource-card-hover` if needed (otherwise inline Tailwind is fine).

### Out of scope
- No DB schema changes (no per-resource image column).
- No changes to translation logic, filtering logic, or the Congressman Jackson card.
- Admin Resources editor unchanged.
