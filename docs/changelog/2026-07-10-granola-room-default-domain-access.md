## 2026-07-10 - linkrunner-dsr — Default Granola room access to the attendee's domain

### Changed
- `from-granola`: when creating a room from a Granola meeting, the access allowlist now **falls back to the meeting's cached `contact_email` domain** if the participants carried no usable email. Previously the allowlist was built only from participant emails, so a meeting synced from a transcript (no participant emails) produced an empty allowlist → `restrict_access: false` → a **public room**, even though the attendee's domain was known on `contact_email`.
- Result: rooms created from Granola meetings default to **private**, restricted to the attendee's company domain (or their exact email for a personal-provider attendee).

### Files touched
- `src/app/api/rooms/from-granola/route.ts` — contact_email domain fallback in the access derivation.

### Verified
- `npm run build` clean.
- Checked all cached meetings: **50/52 now yield an access grant from `contact_email`** (e.g. Ariai → `@ariai.in`, CARS24 → `@cars24.com`, FatakPay → `@fatakpay.com`, Giottus → `@giottus.com`). The 2 without are meetings synced from a raw transcript with no email captured.

### Notes
- Affects newly created rooms only. Existing open rooms are unchanged and can be locked separately using the same fetched domain.
