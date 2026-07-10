## 2026-07-10 - linkrunner-dsr — Brief generator: prefer ANTHROPIC_API_KEY (subscription token can't call the API)

### Changed
- `brief-from-transcript` now prefers **`ANTHROPIC_API_KEY`** (`x-api-key` header) over `ANTHROPIC_AUTH_TOKEN`. The subscription OAuth-token path from the previous change **401s on direct `api.anthropic.com` calls** — Claude subscription tokens are restricted to Claude Code — so the generator fell back to dumping the raw transcript on the deployed site.
- Pinned the default model to `claude-haiku-4-5-20251001`.
- Still Anthropic-only; OpenRouter remains removed.

### Files touched
- `src/lib/brief-from-transcript.ts`

### Verified
- `npm run build` + `npm run lint` clean (0 errors).
- Confirmed on the live deploy: the subscription OAuth token failed (transcript rendered verbatim). Pending re-test once `ANTHROPIC_API_KEY` is set in Vercel.

### Notes
- Cost is ~a cent per brief on Haiku (negligible). A truly $0 path would require a non-Anthropic free provider (Groq/Gemini), since Anthropic subscription tokens cannot authenticate API calls.
