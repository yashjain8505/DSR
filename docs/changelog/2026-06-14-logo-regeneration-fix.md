## 2026-06-14 - linkrunner-dsr — Stop room regeneration from clobbering curated logos

### Problem
Both room-create paths (`api/rooms/route.ts`, `api/rooms/from-granola/route.ts`)
call `extractBrandAssets` -> `extractLogo`, which falls back to a low-res Google
favicon (or a raw favicon.ico). So regenerating / recreating a room overwrote
the hand-picked hi-res logos with blurry favicons again (confirmed: KheloMore and
Sid's Farm had reverted).

### Changed
- **`src/lib/brand-colors.ts`**: added a `CURATED_LOGOS` map (bare domain ->
  self-hosted Supabase logo URL), checked at the very top of `extractLogo` before
  any auto-extraction. Covers `khelomore.com`, `sidsfarm.com`, `rforrabbit.com`.
  These now win over extraction and survive regeneration.
- **Production data (re-applied directly):** `rooms.logo_url` set back to the
  curated Supabase logos for `khelomore`, `sids-farm`, `r-for-rabbit`. Vama's
  logo was the wrong `com.vama.app` App Store icon, so it was cleared to null
  (renders the monogram) until the correct logo is supplied.

### Notes
- The override only runs during room creation, so it needs a deploy to protect
  future regenerations; the existing rooms were fixed directly in the DB.
- Vama (`vama.app`) intentionally left out of `CURATED_LOGOS` until the correct
  logo is uploaded (vama.app only exposes a tiny favicon).

### Verified
- `npm run build` passes; `npm run lint` clean on the changed file.
- DB updates confirmed (old favicon URLs -> curated URLs; vama -> null).

### Notes (deploy)
- Code change committed locally, not pushed.
