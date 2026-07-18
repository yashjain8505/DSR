## 2026-07-18 - linkrunner-dsr — Rooms private by default, locked to prospect domain + Linkrunner

### Changed
New rooms are now **restricted by default** (the "restrict access to invited emails" toggle
starts ON), admitting the prospect's own company domain plus the Linkrunner team:
- `POST /api/rooms/from-granola` (Generate Room) now sets `restrict_access: true`
  unconditionally (was `accessEntries.length > 0`).
- `POST /api/rooms` (manual create) now sets `restrict = body.public !== true`
  (was `... && accessEntries.length > 0`) — private unless the admin explicitly marks it public.
- Both paths now **fall back to the company's resolved domain** (`domainFromEmail` →
  `domainFromSlug`/website) when no attendee/contact email carried one, so a room synced from
  a note with no emails still allow-lists the prospect's domain instead of sealing shut.

### Why this is safe
- **Linkrunner is always allowed.** `isEmailAllowed` (`src/lib/room-access.ts`) short-circuits
  `@linkrunner.io` to `true`, so a restricted room is never sealed to the team — no allowlist
  entry needed for Linkrunner. So "everyone with Linkrunner + their domain" was already half
  done; this change makes the prospect-domain half the default.
- When someone from e.g. Nike attends with a `@nike.com` email, `@nike.com` is seeded into
  `room_access` and the room is private to Nike + Linkrunner automatically.

### Edge case
If **no** prospect domain can be determined (no attendee email, no contact email, no
resolvable website), the room is private to the Linkrunner team only until a domain/email is
added in the admin. This is the deliberate "secure by default" trade — previously such a room
was left public. Adjust per-room via the access toggle if a room should be open.

### Files touched
- `src/app/api/rooms/from-granola/route.ts` — domain fallback into `accessEntries`;
  `restrict_access: true`.
- `src/app/api/rooms/route.ts` — domain fallback into `accessEntries`;
  `restrict = body.public !== true`.

### Verified
- `npm run build` + `npm run lint` — 0 errors (pre-existing warnings only).

### Notes
- Only affects **newly created** rooms; existing rooms keep their stored `restrict_access`.
- The Elixir Cards room (made by the one-off `create-elixir-room` script) is still open and has
  no seeded domain, because its attendees' emails were never captured. It can be locked once
  Ritik's/Rishik's email domain is known.
- The DB column default (`migration 007`: `restrict_access ... default false`) is unchanged;
  both creation routes set the value explicitly, so it never applies to these paths.
