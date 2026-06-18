Redesign the /donate page into a multi-column layout to accommodate a new embedded HeyGen video while shortening vertical scroll.

## Layout changes

1. **Widen page container** from `max-w-3xl` to `max-w-5xl` so two-column rows have comfortable horizontal breathing room on desktop.

2. **Row 1 — Two cards side by side**
   - Financial Giving (left)
   - Corporate Sponsorship (right)
   - Use a responsive 2-column grid (`grid-cols-1 md:grid-cols-2`) with `gap-6`.

3. **Row 2 — Video + card side by side**
   - HeyGen embed `<iframe>` in the left column (responsive `aspect-video` container, full width of its column).
   - Volunteer card in the right column.
   - Same responsive 2-column grid pattern.

4. **Row 3 — Full-width card**
   - Other Ways to Help spans the full width as a single card below the video row.

## Video embed details
- Source: `https://app.heygen.com/embeds/195417e5257446d8a636bb4b480ff50d`
- Title: "The Place"
- Wrapped in a responsive container (`aspect-video`) so it scales with the column width.
- Allow attributes: `encrypted-media; fullscreen`

## Mobile behavior
- Below `md` breakpoint, every row collapses to a single column (cards and video stack vertically) so readability is preserved on phones.

## Files to modify
- `src/routes/donate.tsx` — restructure the card layout, add HeyGen iframe embed, adjust container width.
- No new components needed; all work is within the existing route file.