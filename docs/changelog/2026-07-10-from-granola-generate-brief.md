## 2026-07-10 - linkrunner-dsr — from-granola generates a structured brief from the transcript

### Changed
- `from-granola`: when a cached meeting has **no pre-built `meeting_brief`**, it now generates a structured brief from the raw transcript/summary via `generateBriefFromTranscript` (Groq) instead of wrapping the raw transcript. So a room created straight from a meeting (before any brief was generated) no longer shows a raw-transcript dump. Bumped `maxDuration` to 60 for the added LLM call.

### Files touched
- `src/app/api/rooms/from-granola/route.ts`

### Verified
- `npm run build` + `npm run lint` clean (0 errors).
- Root cause of the TimelyBills room showing a raw transcript: the room was created *before* its structured brief existed, and `from-granola` only wrapped the raw summary. The existing `/timelybills` room was patched directly with the structured brief.

### Notes
- Uses `GROQ_API_KEY` (already added in Vercel). Without a key, it falls back to the raw summary exactly as before, so it never fails room creation.
