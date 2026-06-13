## 2026-06-13 - linkrunner-dsr — Ideation engine: OpenRouter provider option (OpenAI-compatible)

### Changed
- The ideation pipeline now supports **two LLM providers**, selected by which
  credential is set:
  - **OpenRouter** (`OPENROUTER_API_KEY`) — OpenAI-compatible gateway. When set,
    the engine calls `https://openrouter.ai/api/v1/chat/completions` via `fetch`
    with a namespaced slug (default `anthropic/claude-haiku-4.5`). No Anthropic
    prompt caching / adaptive thinking on this path.
  - **Anthropic direct** (existing) — `ANTHROPIC_AUTH_TOKEN` (subscription OAuth)
    or `ANTHROPIC_API_KEY`, bare model id (default `claude-haiku-4-5`), keeps
    prompt caching + adaptive thinking.
- `llmJson` split into provider helpers (`anthropicText` / `openRouterText`) that
  return raw text; the JSON fence-strip + parse stays shared.
- `MAX_TOKENS` 16000 → 8000 (plenty for the JSON outputs; within Claude 3.5
  Haiku's 8192 cap; lowers per-call cost / credit reservation).
- Added `scripts/ideation/verify-run.ts` — loads `.env.local`, runs the full
  pipeline for a prospect (GoDigit by default), prints run id / mode / play +
  wild-card counts / a sample draft. Imports the pipeline **dynamically** so it
  reads env after the `.env.local` loader (ESM evaluates static imports first).

### Files touched
- `src/lib/ideation/pipeline.ts` (provider branch + MAX_TOKENS)
- `scripts/ideation/verify-run.ts` (new)
- `.env.example` (`OPENROUTER_API_KEY` + provider/model notes)
- `AGENTS.md` (env var list)
- `docs/changelog/2026-06-13-ideation-openrouter.md` (this file)

### Verified
- `npm run build` passes; `npm run lint` clean on `pipeline.ts` and
  `verify-run.ts` (the 43 baseline errors elsewhere are unchanged).
- **OpenRouter integration confirmed at the request layer**: `verify-run.ts`
  against the live key authenticated, resolved `anthropic/claude-haiku-4.5`, and
  received real *priced* responses — the run stops on a **402 "requires more
  credits"**, not an auth/format error. So the wiring is correct; the supplied
  OpenRouter account is simply out of credits.
- A full green pipeline run was NOT achieved — blocked on OpenRouter credits, not
  code. Haiku 4.5 on OpenRouter is $1/M in, $5/M out; a run ≈ $0.11 (the matcher
  carries the ~45K-token KB), so ~$5 ≈ 45 runs.

### Notes
- Top up at https://openrouter.ai/settings/credits, then re-run
  `npx tsx scripts/ideation/verify-run.ts` for the green end-to-end.
- The OpenRouter key was pasted into a chat session — **rotate it**, then put the
  new value in `.env.local` and the Vercel project env (`OPENROUTER_API_KEY`).
- Switching back to Anthropic is just removing `OPENROUTER_API_KEY` and setting
  `ANTHROPIC_AUTH_TOKEN` or `ANTHROPIC_API_KEY` (see 2026-06-13-ideation-auth-token-haiku.md).
