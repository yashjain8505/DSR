## 2026-06-24 - linkrunner-dsr — Gimbooks room logo

### Changed
- The gimbooks room had no logo (logo_url null). Sourced the official GimBooks
  app icon (GIM INFO SOLUTIONS), verified it matches the brand, hosted at
  assets/logos/gimbooks.png, repointed rooms.logo_url, and added gimbooks.com to
  CURATED_LOGOS so regeneration keeps it.

### Files touched
- `src/lib/brand-colors.ts`

### Verified
- Logo serves 200; room repointed; npm run build/lint -> 0.
