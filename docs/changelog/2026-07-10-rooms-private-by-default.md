## 2026-07-10 - linkrunner-dsr — Rooms are private by default

### Changed
- Rooms created via `POST /api/rooms` (the admin **Create New Room** page) are now **private by default**, restricted to the meeting attendee's company domain. Previously a room with no explicit access domain was open to anyone with the link — which defeats the purpose of a sales room.
- Access domain is derived in priority: the explicit **Access Domain** field → the **attendee's email** domain → the **website**. A personal-provider attendee (gmail, etc.) gets their exact email granted instead of a domain, so the room is still private to them. Only a truly anonymous room (no email, website, or domain) stays open.
- Added an explicit **"Make this room public"** opt-out on the form (off by default) and a `public` flag on the create payload.

### Files touched
- `src/app/api/rooms/route.ts` — restrict-by-default access logic; seeds `room_access` with the domain (or exact email).
- `src/app/(admin)/admin/rooms/new/page.tsx` — access domain auto-fills from the attendee email (skips personal providers); private-by-default copy; "Make this room public" checkbox.
- `src/lib/types/index.ts` — `CreateRoomPayload.public`.

### Verified
- `npm run build` + `npm run lint` clean (0 errors).

### Notes
- `from-granola` already restricted to attendee domains; this brings the manual create flow in line.
- Existing rooms are unchanged by this — it only affects newly created rooms. Already-open rooms can be locked from the room's access settings (or on request).
