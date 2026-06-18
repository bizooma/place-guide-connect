## Replace small loading text with animated progress indicator in Document Helper

### Context
In `src/routes/help.document.tsx`, the current loading state while the AI reads and translates a document is a small text line at the bottom of the card:
```tsx
<p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
  <Sparkles className="h-4 w-4 animate-pulse text-accent" /> Reading your document in {language}…
</p>
```
This is barely visible and gives poor user feedback during a multi-step process (file upload → storage → AI analysis).

### Goal
Replace this with a prominent, animated visual progress indicator that makes it unmistakably clear the system is working.

### Changes
1. **Create a reusable `DocumentLoadingState` component** in the same file (or inline) that renders:
   - A full-width **indeterminate animated progress bar** using the brand primary green color (`bg-primary`) with a continuous shimmer/slide animation (CSS `@keyframes` with a sliding lighter stripe)
   - Larger, centered status text showing the current stage
   - A subtle pulsing or fade animation on the text to reinforce activity
   - Keep the language reference in the message

2. **Style choices**
   - Progress bar: `h-3`, `rounded-full`, `bg-primary/20` track, `bg-primary` fill with an animated gradient overlay that slides continuously
   - Use Tailwind arbitrary values or add a single CSS keyframe animation in `src/styles.css` for the indeterminate shimmer effect
   - Text: `text-base` or `text-lg`, `text-primary-deep`, centered, with `animate-pulse` or a gentler fade
   - Wrap in a `surface-card` sub-section or just a padded div within the existing card

3. **Build validation**
   - Run `lovable-exec build` to ensure no type or syntax errors
   - Verify the animation runs smoothly in the preview

### Files to modify
- `src/routes/help.document.tsx` — replace the `{loading && …}` block
- `src/styles.css` — optionally add a single `@keyframes indeterminate-progress` utility if Tailwind's built-in animations aren't sufficient for the shimmer stripe effect