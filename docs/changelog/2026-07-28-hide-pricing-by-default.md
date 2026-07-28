## 2026-07-28 - linkrunner-dsr — Hide the Pricing tab by default, on all rooms

### Changed
- **Pricing is now hidden on every room.** Backfilled all 39 rooms by adding `"pricing"` to `rooms.hidden_sections` (idempotent; 35 updated, 4 already had it).
- **New rooms hide it too.** Added `DEFAULT_HIDDEN_SECTIONS = ["pricing"]` in `constants.ts` and wired it into both room-creation inserts — `api/rooms` (admin UI) and `api/rooms/from-granola`.

### How it works
- Visibility is driven by `hidden_sections`: `computeVisibleTabs` (`room-tabs.tsx:450-456`) returns `!hidden.has(tab)`, so `"pricing"` in the set removes both the Pricing tab and its content. The stray `ALWAYS_VISIBLE_TABS` constant is defined-but-unused, so it does not force pricing on.
- This is the same mechanism the admin room editor already uses (its visibility toggles write `hidden_sections`, and Pricing is one of them), so **an admin can re-show Pricing per room** by re-checking it — "hidden by default", not forced off.

### Files touched
- `src/lib/constants.ts` (`DEFAULT_HIDDEN_SECTIONS`)
- `src/app/api/rooms/route.ts`, `src/app/api/rooms/from-granola/route.ts` (seed `hidden_sections`)
- `docs/changelog/2026-07-28-hide-pricing-by-default.md` (this file)
- Supabase data otherwise — `hidden_sections` on all `rooms`.

### Verified
- `npx tsc --noEmit` clean; `npm run build` compiles; `npm run lint` 0 errors / 58 warnings (unchanged baseline).
- Data-level check (the tab nav is client-rendered, so SSR HTML grep is not a valid signal): e.g. `payme-india hidden_sections = ["recap_next_steps","pricing"]` — `pricing` present, and `computeVisibleTabs` filters it out.
