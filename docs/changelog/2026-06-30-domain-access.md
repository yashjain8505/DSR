# Domain-based room access

Restricted rooms can now allow a whole email domain, not just individual emails.

- `src/lib/room-access.ts` (new): `isEmailAllowed(admin, roomId, email)` — allows
  @linkrunner.io, an exact allowlist entry, OR a domain entry. A domain entry is
  a `room_access` row whose `email` is stored as "@company.com" (or bare
  "company.com"); any visitor from that domain is then allowed.
- `src/app/api/rooms/access-check/route.ts` and
  `src/app/api/rooms/visitors/route.ts`... (`src/app/api/visitors/route.ts`):
  both now use the shared helper, so domain entries work for the returning-
  visitor re-check and the email gate.
- The invite-email validation already accepts "@company.com", so admins can add a
  domain straight from the room's Access UI.

Applied to the Tractor Junction room: restricted + allowlist `@tractorjunction.com`
(plus @linkrunner.io always allowed).
