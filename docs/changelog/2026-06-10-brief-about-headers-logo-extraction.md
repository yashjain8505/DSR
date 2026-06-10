## 2026-06-10 - linkrunner-dsr — Fix brief "About …" headers + robust logo extraction (Bigul)

### Changed
- **Meeting brief parser:** headers starting with "About …" (standard Granola
  pattern, e.g. "About Himanshu and Bigul") now map to the canonical
  "Your Situation" section. Bigul's recap tab now renders the structured
  icon-led card format (same as Vama) instead of leading with Q&A and
  generic sections.
- **Brand/logo extraction (`lib/brand-colors.ts`):**
  - New strategy 2.5: any `<link rel=icon>` is downloaded and measured with
    sharp — accepted if actually ≥64px, regardless of declared type/sizes.
    (Bigul served a 498×501 PNG behind `type="image/x-icon"`, which the
    attribute-based strategy skipped.)
  - Google-favicon fallback is now validated before use — it returns 404 for
    domains Google hasn't indexed, which previously stored a broken image URL.
  - Removed the duplicate unvalidated Google fallback from both room-creation
    routes; a null logo renders as a monogram instead of a 404 image.
- **Data fix:** Bigul room `logo_url` →
  `https://bigul.co/assetData/img/favicon.png`. Brand color kept at `#122dfd`
  (matches bigul.co's own theme color; the favicon's neon `#00ffc0` is an
  accent, not the primary).

### Files touched
- `src/lib/meeting-brief.ts` (situation regex)
- `src/lib/brand-colors.ts` (strategy 2.5 + validated fallback)
- `src/app/api/rooms/route.ts`, `src/app/api/rooms/from-granola/route.ts`
- DB: rooms.logo_url for slug `bigul`

### Verified
- Parser run over all rooms: bigul → situation/questions/competitive_positioning
  (structured ✓); vama and fatakpay unchanged.
- `extractBrandAssets("bigul.co")` → real favicon URL; `vama.app` still falls
  back to the (validated, working) Google favicon.
- `npm run build` passes; lint 0 errors on touched files.
