## 2026-07-16 - linkrunner-dsr — Brief generator is Groq-only + env docs updated

### Changed
- `src/lib/brief-from-transcript.ts` (transcript → structured meeting brief, used by the manual **Create New Room** flow `POST /api/rooms` and by `from-granola` when a meeting has no pre-built brief) now uses **`GROQ_API_KEY` only**. Removed the `ANTHROPIC_API_KEY` fallback path entirely, per request to run this feature on Groq alone.
  - `hasCredential()` → checks `GROQ_API_KEY` only.
  - `pickModel()` → `GROQ_MODEL ?? "llama-3.3-70b-versatile"` (dropped the Anthropic model branch).
  - `callLLM()` → Groq (`api.groq.com`, OpenAI-compatible) only; throws `no LLM credential (set GROQ_API_KEY)` when unset.
  - The **verbatim fallback is unchanged**: with no key (or on any Groq error), the raw transcript is kept under a `## Notes` heading so room creation never fails.
- Documented the Groq vars that were previously undocumented:
  - `.env.example` — added `GROQ_API_KEY` / `GROQ_MODEL` with a note that Groq is the sole brief provider; clarified that `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` are for the optional from-granola brief scrub only.
  - `AGENTS.md` — added `GROQ_API_KEY` / `GROQ_MODEL` to the env list and noted that `ANTHROPIC_*` / `OPENROUTER_*` / `ENGINE_MODEL` belong to the from-granola scrub + ideation engine, not the brief generator.

### Not changed (deliberately)
- `src/app/api/rooms/from-granola/route.ts` still has its own optional `ANTHROPIC_API_KEY` brief rewrite/scrub (deterministic fallback when unset) — a separate path from the transcript brief generator.
- `src/lib/ideation/pipeline.ts` still uses `OPENROUTER_API_KEY` / `ANTHROPIC_*` / `ENGINE_MODEL` — the ideation engine is an unrelated feature; those vars are live, not dead.

### Room access — verified, no change needed
- Confirmed the requested default (attendee + their whole company domain gets access, e.g. a `@nike.com` attendee → everyone `@nike.com`) is already implemented in **both** create paths:
  - `POST /api/rooms` (manual): access domain = explicit field → attendee email domain → website; a corporate attendee seeds `@domain`, a personal-provider attendee (gmail/…) seeds their exact email; `restrict_access` true by default (explicit "Make public" opt-out).
  - `POST /api/rooms/from-granola`: grants each prospect attendee's `@domain` (personal providers → individual email), with a `contact_email`-domain fallback; `restrict_access = accessEntries.length > 0`.
  - `domainFromEmail()` (`src/lib/brand-colors.ts`) returns the corporate domain and `null` for generic providers (gmail/yahoo/outlook/icloud/…), which is what drives the "whole company vs. just this person" split.

### Files touched
- `src/lib/brief-from-transcript.ts`, `.env.example`, `AGENTS.md`, this changelog.

### Verified
- `npm run lint` + `npm run build` clean (0 errors; only pre-existing unused-var warnings).

### Notes
- **Live-site requirement unchanged:** `GROQ_API_KEY` must be set in Vercel (Production + Preview) or the deployed brief generator falls back to the verbatim `## Notes` dump.
