## 2026-06-10 - linkrunner-dsr — Secondary brand color, visible hero dots, canonical brief format for all new rooms

### Changed
- **Secondary/accent brand color (migration 008, applied to prod via Management API):**
  - `rooms.brand_secondary_color` column; Bigul set to `#00ffc0` (neon green)
    alongside its navy `#122dfd` primary.
  - Hero renders a soft accent glow (bottom-right) in the secondary color;
    rooms without one fall back to Linkrunner purple, which blends invisibly
    into the existing gradient corner.
  - `extractBrandAssets` now also returns `secondaryColor`: first site-declared
    color (theme-color meta → CSS var → SVG fill → dominant CSS hex) that is
    ≥45° hue-distant from the primary. Both room-creation routes store it.
  - Admin Room Settings: new "Secondary / Accent Color" input with swatch.
- **Hero dot pattern** opacity raised 0.06 → 0.14 (visible but subtle, per ask).
- **Canonical brief format guarantee:** `from-granola` now normalizes the brief
  after the POV rewrite — `parseBrief` → `serializeBrief` when structure is
  detected — so every new room stores canonical headers ("Your Situation",
  "Questions & Answers", …) and renders the structured recap (the "Vama
  format") even when the LLM rewrite is skipped (e.g. ANTHROPIC_API_KEY unset).

### Files touched
- `supabase/migrations/008_brand_secondary_color.sql` (new; applied)
- `src/lib/brand-colors.ts`, `src/lib/types/index.ts`
- `src/components/room/room-hero.tsx`, `src/app/(prospect)/room/[slug]/page.tsx`
- `src/app/api/rooms/route.ts`, `src/app/api/rooms/from-granola/route.ts`
- `src/app/(admin)/admin/rooms/[roomId]/page.tsx`
- DB: rooms.brand_secondary_color for slug `bigul`

### Verified
- `extractBrandAssets("bigul.co")` → logo + `#00ffc0` primary + `#122dfd`
  secondary (both colors found automatically for future rooms).
- Earlier "old format" report was a stale tab: the parser fix from commit
  2bf15f8 is confirmed live in the deployed JS bundle.
- `npm run build` passes; 0 lint errors on touched files.

### Notes
- ANTHROPIC_API_KEY is not set locally (and likely not in Vercel) — the
  second-person POV rewrite is currently skipped for new rooms; the
  deterministic normalization above keeps the format correct regardless.
  Add the key in Vercel for warmer, second-person briefs.
