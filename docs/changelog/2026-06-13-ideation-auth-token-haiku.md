## 2026-06-13 - linkrunner-dsr — Ideation engine: subscription OAuth token auth + Haiku default

### Changed
- **Auth alternative to the API key.** The ideation pipeline now constructs its
  Anthropic client from `ANTHROPIC_AUTH_TOKEN` (a Claude subscription OAuth token,
  mint with `claude setup-token`) when that var is set — sent as a Bearer token
  plus the required `anthropic-beta: oauth-2025-04-20` header. Falls back to the
  metered `ANTHROPIC_API_KEY` when the token is absent. This lets the engine run
  off a Claude subscription without a separate billed key.
  - ⚠️ The OAuth token is short-lived and **not auto-refreshed** — good for
    local/manual runs, re-mint when it expires. Subscription tokens are intended
    for interactive use, so this is a stopgap, not the production-blessed path.
- **Default model → `claude-haiku-4-5`** (was `claude-opus-4-8`). `ENGINE_MODEL`
  / `ANTHROPIC_MODEL` env overrides still win, so Opus is one env var away.
- **Thinking is now model-aware.** Adaptive thinking (`thinking: {type:
  "adaptive"}`) only ships on the 4.6 generation and later, so the pipeline now
  sends it only for Opus 4.6/4.7/4.8, Sonnet 4.6, and Fable 5. Haiku 4.5 (the new
  default) and older models would 400 on adaptive thinking, so it's omitted there.
- No change to the Granola room-generation route — it gates strictly on
  `ANTHROPIC_API_KEY` and uses raw `fetch` with `x-api-key`, so it ignores
  `ANTHROPIC_AUTH_TOKEN` entirely.

### Files touched
- `src/lib/ideation/pipeline.ts` (client auth fallback, Haiku default, thinking guard)
- `.env.example` (`ANTHROPIC_AUTH_TOKEN` declared; ENGINE_MODEL default note → Haiku)
- `AGENTS.md` (env var list: `ANTHROPIC_AUTH_TOKEN`, `ENGINE_MODEL`, `DIGEST_WEBHOOK_URL`)
- `docs/changelog/2026-06-13-ideation-auth-token-haiku.md` (this file)

### Verified
- `npm run build` passes; all ideation routes still register.
- `npm run lint`: zero findings on `pipeline.ts`; the 43 errors / 57 warnings are
  the pre-existing baseline (scripts/ `require()`, `brand-colors.ts` unused
  helpers, `button.tsx`, room `<img>` warnings) — untouched by this change.
- Runtime NOT verified end-to-end: requires a real `ANTHROPIC_AUTH_TOKEN` in
  `.env.local`. Token value not handled here per the never-read-`.env.local` rule.

### Notes — setup for Yash
1. Mint a token: `claude setup-token` (uses your Claude subscription).
2. Put it in `.env.local` as `ANTHROPIC_AUTH_TOKEN=<token>` (and in Vercel if you
   want prod runs — but mind the no-auto-refresh caveat above).
3. Leave `ENGINE_MODEL` unset to use Haiku, or set it to override.
4. Run a prospect from `/admin/ideation` (GoDigit is prospect #1) and confirm the
   pipeline produces plays + wild cards.
