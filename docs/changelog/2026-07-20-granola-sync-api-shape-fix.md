## 2026-07-20 - linkrunner-dsr — Granola sync: fix four wrong assumptions about the API payload

### Why
The first real call recorded under `tools@linkrunner.io` ("Linkrunner <> Virendra || Intro call", Aliceblue) did not appear after clicking Sync. The note was present and the key could read it — the sync itself was discarding it. The route had been written against an assumed payload shape and, because of the long-running `403 SUBSCRIPTION_INACTIVE`, had **never once been exercised against a real Granola response**. Four assumptions were wrong.

### Fixed
1. **The list endpoint returns no attendees.** `GET /v1/notes` returns only `id, object, title, owner, created_at, updated_at` — no `people`, no summary, no transcript. `classifyMeeting()` read attendees off the list payload, so it saw an empty array for *every* note and classified all of them `no_participants`. **Nothing could ever have synced.** Notes are now fetched individually via `fetchNoteDetail()` *before* classification; the detail endpoint is the only one that carries attendees.
2. **The field is `attendees`, not `people`** — and its entries are `{name, email}` with no `is_creator` and no `company`. Added `buildParticipants()`, which derives `is_creator` by matching `owner.email` and merges `calendar_event.invitees` as a fallback (the two lists genuinely differ: on this call `attendees` held the recording account while `invitees` held the organiser's own address, so merging yields 5 participants where either alone gives 4).
3. **`transcript` is an array of timed segments**, not a string — `{text, start_time, end_time, speaker}`. The old code assigned the raw array into the `summary` text column. Added `flattenTranscript()`, which joins segments into speaker-labelled lines.
4. **The summary fields are `summary_markdown` / `summary_text`**, not `summary` / `notes`. The fallback when a note has no transcription had therefore always been empty.

### Also
- `GET /api/granola/sync?dryRun=1` now honours the dry-run flag as well, so the whole path can be exercised with the `CRON_SECRET` credential instead of an admin session.
- New `unreadable[]` field in the response lists notes whose detail fetch failed, so a partial API outage doesn't silently shrink the result.

### Files touched
- `src/app/api/granola/sync/route.ts`
- `docs/changelog/2026-07-20-granola-sync-api-shape-fix.md` (this file)

### Verified
- `npx tsc --noEmit` clean; `npm run build` compiles; `npm run lint` 0 errors / 58 warnings (unchanged baseline, sync route clean).
- Dry run against the live API, before → after: `would_sync` 0 → **1**, `skipped_no_participants` 1 → **0**.
- Preview resolved `company_name: "Aliceblueindia"`, `contact_email: "virendra@aliceblueindia.com"`, `participants: 5`, `has_transcript: true`.
- Real run then returned `synced: 1`; `granola_meeting_cache` went 54 → 55 rows and now holds the meeting (`cache_id=98209fcf-e918-4316-bd7e-5c5e2c225203`).

### Notes
- **`company_name` derives as "Aliceblueindia"**, from the `aliceblueindia.com` email domain — the brand is "Aliceblue". `extractCompanyName`'s domain-label heuristic has no way to know that. Curated names are preserved across re-syncs, so renaming the row once is permanent. Left alone deliberately: tightening the heuristic would change derived names for other prospects too.
- The diagnostic that found this is worth repeating on any future "it didn't sync" report: fetch a single note detail and print its field *names*. Every one of these four bugs was a field-name mismatch, invisible from the sync's own output.
