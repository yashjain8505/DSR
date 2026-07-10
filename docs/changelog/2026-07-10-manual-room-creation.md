## 2026-07-10 - linkrunner-dsr — Self-service room creation from a transcript

### Changed
- The admin **Create New Room** page (`/admin/rooms/new`) now builds a fully-populated room end-to-end, no manual/Claude steps:
  - **Paste the raw meeting transcript** → converted server-side into the structured, customer-POV brief (Your Situation / Pain Points / What We Showed You / Next Steps), the same format the room recap renders.
  - **Upload the company logo image** → stored in the Supabase `assets` bucket and used as the room logo.
  - **Company website** → used to auto-pull the brand color (and a fallback logo if none uploaded).
  - **Access domain** → the room is restricted and everyone with an email at that domain can open it (a `room_access` `@domain` row).
  - Attendee name + contact email fields retained.

### Files touched
- `src/app/(admin)/admin/rooms/new/page.tsx` — new fields: logo file upload, company website, access domain, transcript textarea; uploads the logo then POSTs.
- `src/app/api/rooms/route.ts` — accepts `transcript` / `website_url` / `access_domain`; generates the brief, resolves the brand domain (website first), sets `restrict_access` + seeds domain access. `maxDuration = 60`.
- `src/lib/brief-from-transcript.ts` (new) — transcript → structured brief via **OpenRouter** (Anthropic-direct fallback), normalized through `parseBrief`/`serializeBrief` so it renders identically to every other room.
- `src/lib/types/index.ts` — `CreateRoomPayload` extended with `transcript`, `website_url`, `access_domain`.

### Verified
- `npm run build` + `npm run lint` clean (0 errors).
- `generateBriefFromTranscript` tested against a sample transcript via OpenRouter → produced `## Meeting Summary` + Your Situation / Pain Points / What We Showed You sections + a Next Steps card, in second person with no pricing.

### Notes
- LLM provider is **OpenRouter** — only `OPENROUTER_API_KEY` is set in this env (`ANTHROPIC_*` are not; `from-granola`'s Anthropic-only rewrite silently falls back here). Model defaults to `anthropic/claude-haiku-4.5` (override with `ENGINE_MODEL`).
- If no LLM credential is present or the call fails, the transcript is kept verbatim under a Notes heading so room creation never fails.
