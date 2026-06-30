# Default meeting rooms to domain-based access

`src/app/api/rooms/from-granola/route.ts`: when a room is created from a Granola
meeting, it now grants access by each attendee's company DOMAIN (e.g.
`@company.com`) rather than only their individual email — so anyone from the
attendees' companies can enter, not just the people on the call.

- Each external attendee's domain is derived via `domainFromEmail`. Company
  domains are added as `@domain` allowlist entries; personal-provider attendees
  (gmail, yahoo, etc., where `domainFromEmail` returns null) are added as their
  individual email instead, so a room is never opened to an entire public email
  provider.
- The room is restricted (`restrict_access = true`) whenever at least one entry
  exists; @linkrunner.io is always allowed.

Builds on the domain-access matching added in `src/lib/room-access.ts`.
