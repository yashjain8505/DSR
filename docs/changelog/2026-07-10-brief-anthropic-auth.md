## 2026-07-10 - linkrunner-dsr — Brief generator uses Anthropic auth (not OpenRouter)

### Changed
- `src/lib/brief-from-transcript.ts` now calls the Anthropic API directly using **`ANTHROPIC_AUTH_TOKEN`** (a Claude subscription OAuth token; `Bearer` + `anthropic-beta: oauth-2025-04-20`) **only**. The OpenRouter path was removed entirely (OpenRouter must not be used), along with the metered-API-key fallback.
- If `ANTHROPIC_AUTH_TOKEN` is unset or the call fails, the transcript is kept verbatim under a Notes heading so room creation never fails.

### Files touched
- `src/lib/brief-from-transcript.ts`

### Verified
- `npm run build` + `npm run lint` clean (0 errors).
- Runtime auth path (subscription OAuth token → `api.anthropic.com` Messages API) is being confirmed on the live Vercel deployment by creating a room with a transcript and checking whether the recap renders structured (works) vs raw (auth failed). `ANTHROPIC_AUTH_TOKEN` is set in Vercel (Production + Preview); intentionally not kept in local `.env.local`.

### Notes
- If the subscription OAuth token does not authenticate against the raw Messages API, the fallback is a metered `ANTHROPIC_API_KEY` (with the `x-api-key` header) - a ~2-line change.
