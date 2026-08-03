## 2026-08-03 - linkrunner-dsr — Stop briefs leaking raw transcripts; rooms for individuals

### The bug: a Groq rate limit published our transcript to prospects
`fallbackBrief()` pasted the **entire raw transcript** into the prospect-facing brief
whenever the LLM call failed:
```js
const content = `${snap.join("\n")}\n\n## Notes\n${transcript.trim()}`;
```
Two rooms shipped like that — the customer could read our whole unedited conversation,
speaker labels and all, including our own pitch played back at them.

**Root cause, reproduced live:**
```
Groq 413: Request too large for model `llama-3.3-70b-versatile` … service tier
`on_demand` on tokens per minute (TPM): Limit 12000, Requested 12269
```
Groq counts `input + max_tokens` against the TPM budget **up front**. A ~28k-char
transcript is ~8.2k input tokens; `max_tokens: 4096` pushed the request to 12,269 against a
12,000 limit. It sat *just* over the line, so it failed or succeeded depending on what else
ran that minute — which is why this looked intermittent. `GROQ_API_KEY` and `GROQ_MODEL` in
Vercel were both fine; this was never a config problem.

### Fixed
- **`fallbackBrief` → `emptyBrief`** — a failed generation now stores **nothing**. The
  transcript is never published. It isn't lost either: it stays in
  `granola_meeting_cache.summary` and the brief can be regenerated.
- **`max_tokens` 4096 → 1536** — the real fix. Briefs land at ~1.2k chars (~300 tokens), so
  4096 was pure headroom that was blowing the rate limit. Requests now sit near 9.7k tokens.
- **Transcripts over 32k chars are trimmed from the MIDDLE**, keeping both ends. A 41k-char
  transcript needs ~13.3k tokens — over the ceiling *every* time, not intermittently, so
  long meetings never generated at all. The middle goes rather than the tail because the
  close is where commitments and next steps live.
- **One retry** (`ATTEMPTS = 2`) — the failure mode is transient, and a retry costs ~2s
  against a brief that is otherwise lost. This alone rescued one of the repairs below.
- **Empty recap sections are now hidden** (`rooms` and `rooms/from-granola`). Without this,
  the fix above would trade a leaked transcript for an empty "What we discussed so far" tab.

### Repaired data
- `unknown` (Sahil Asopa) — 28,676-char dump → proper 1,046-char brief.
- `coto` (Zafar) — 41,267-char dump → proper 1,655-char brief, regenerated from
  `granola_meeting_cache` ("Linkrunner <> Zafar || Intro call").
- Verified across **all** rooms afterwards: 0 transcript dumps, 0 briefs over 5k chars.
- Both source transcripts archived to the session scratchpad before being overwritten.

**Mistake made and corrected during this repair:** the second pass matched "the remaining
dump" by pattern and overwrote `coto`'s brief with Sahil Asopa's content — I had assumed the
only affected rooms were the two I already knew about, and `coto` was a third. Caught
immediately on verification and restored from the Granola cache, which had the original
summary intact. The lesson is in the repair script now: match rooms by **id**, never by
"whatever still looks broken".

### Added: rooms for an individual, not a company
`/room/ramnarayan-tiwari` — no company, so the usual hero chrome is wrong: it would have read
*"Dear Ramnarayan & Ramnarayan Tiwari team,"* beside a `RA` monogram tile.
- `isPersonalRoom()` in `room-hero.tsx` — true when `company_name` matches `contact_name`.
  **Derived, not stored**, so it needs no migration and no hand-applied SQL: create the room
  with the person's name in both fields and it behaves. Every normal room has them differ,
  so nothing else changes.
- Personal rooms greet *"Dear Ramnarayan,"* and show **only the Linkrunner logo** — no
  handshake, no second tile. A monogram of a person's name reads as a placeholder for a
  missing image rather than as branding.
- Applied to `/room/unknown` too (Sahil Asopa, an agency owner with no company in the data):
  *"Dear Sahilasopa12 & Unknown team,"* → *"Dear Sahil,"*.

### Files touched
- `src/lib/brief-from-transcript.ts` · `src/app/api/rooms/route.ts` ·
  `src/app/api/rooms/from-granola/route.ts` · `src/components/room/room-hero.tsx`
- `docs/changelog/2026-08-03-brief-transcript-leak-and-personal-rooms.md` (this file)
- Supabase data: `meeting_briefs` for `unknown` + `coto`; `rooms` row for `unknown`;
  new `ramnarayan-tiwari` room + child rows.

### Verified
- `npx tsc --noEmit` clean; `npm run build` compiles; `npm run lint` 0 errors / 58 warnings
  (unchanged baseline).
- The 413 was reproduced, and the fix confirmed by regenerating both damaged briefs — the
  41k-char coto transcript, which previously could not generate at all, now succeeds.
- Post-repair sweep over every `meeting_briefs` row: 0 dumps, 0 oversized.

### Open / notes
- **`ramnarayan-tiwari` is a PUBLIC room** (`restrict_access: false`), chosen by Yash since
  his email isn't known — anyone with the link can open it after entering any email. Sign-in
  Slack alerts still fire. To lock it down later, add his email to `room_access` and flip
  `restrict_access`.
- Its Recap tab is hidden (no meeting yet). It unhides once a brief is added.
- **Sahil's room still has the slug `unknown`** — renaming changes the URL and breaks any
  link already sent, so it was left. Only the display name was fixed.
- The Groq free tier's 12,000 TPM is the binding constraint on brief generation. A paid tier
  would remove both the truncation and the retry pressure.
