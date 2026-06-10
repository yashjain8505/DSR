## 2026-06-10 - linkrunner-dsr — Lock down admin API routes with HMAC-signed session auth

### Changed
- **Security fix:** all admin API routes were previously unauthenticated, and the admin UI cookie was a forgeable plain `admin_auth=true` string.
- New `src/lib/auth.ts`: session token = `<expiryMs>.<HMAC-SHA256(expiry, secret)>`, secret = `SESSION_SECRET` (falls back to `ADMIN_PASSWORD`, so existing deploys keep working before the env var is set). Exposes `createSessionToken`, `verifySessionToken`, `isAdminAuthenticated`, `requireAdmin`.
- `POST /api/auth/login` now sets the signed `admin_session` cookie (path `/`, httpOnly, sameSite lax, secure in prod, 7-day TTL) and expires the legacy `admin_auth` cookie.
- `(admin)` layout verifies the signed token instead of `value === "true"`.
- Added `requireAdmin()` guard to **39 handlers across 20 route files**: `/api/rooms/**` (incl. `from-granola` and all per-room sub-routes), `/api/assets`, `/api/assets/upload`, `/api/granola/**`, `/api/admin/analytics`.
- Intentionally public (prospect-facing): `POST /api/auth/login`, `POST /api/analytics`, `POST /api/visitors`, `GET /api/assets/proxy`.
- `.env.example` + AGENTS.md updated (`SESSION_SECRET`, new-route guard convention).

### Files touched
- `src/lib/auth.ts` (new)
- `src/app/api/auth/login/route.ts`, `src/app/(admin)/admin/layout.tsx`
- 20 route files under `src/app/api/` (guard + import)
- `.env.example`, `AGENTS.md`

### Verified
- `npm run build` passes; lint errors are all pre-existing (scripts/ `require()`, pre-existing `prefer-const`).
- Live test against `next start` on :3456 with an env-override password (no secrets read): unauthenticated GET/DELETE → 401; forged `admin_auth=true`, `admin_session=true`, and fake-signature tokens → 401; wrong password → 401; correct login → 200 + signed cookie; authenticated GET /api/rooms → 200; public `analytics`/`visitors` unaffected (400 validation, not 401).

### Notes
- Existing admin sessions are invalidated on deploy (cookie renamed) — log in again once.
- Recommended: set a dedicated `SESSION_SECRET` in Vercel project settings so admin password rotation doesn't also invalidate the signing key (fallback to `ADMIN_PASSWORD` keeps it working meanwhile).
- Remaining known gap (unchanged architecture): room content tables are readable via the Supabase anon key (the public prospect page depends on this) — RLS review is a separate task.
