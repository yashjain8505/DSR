## 2026-06-17 - linkrunner-dsr — Linkrunner team always has room access

### Changed
- Any @linkrunner.io email is now always allowed into any room, even
  restricted ones (no allowlist entry needed):
  - `src/app/api/visitors/route.ts`: skip the allowlist check when the email
    ends with @linkrunner.io.
  - `src/app/api/rooms/access-check/route.ts`: return allowed:true for
    @linkrunner.io emails on restricted rooms.

### Files touched
- `src/app/api/visitors/route.ts`, `src/app/api/rooms/access-check/route.ts`

### Verified
- npm run build -> 0; npm run lint -> 0. Email is lowercased before the check.
