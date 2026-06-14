# Ideation Engine — Features Added (13 Jun 2026)

A consolidated log of everything added to the ideation engine in this session.
Per-change detail lives in `docs/changelog/2026-06-13-*`. All shipped to `main`
and deployed. Commits: `cc18aec`, `426e9ee`, `2f34972`.

## At a glance

| # | Feature | Status | Where to use / find it |
|---|---------|--------|------------------------|
| 1 | Flexible LLM provider (OpenRouter / Anthropic key / subscription token) | Live | env vars · `src/lib/ideation/pipeline.ts` |
| 2 | Cheaper default model (Claude Haiku 4.5) | Live | `ENGINE_MODEL` env · `pipeline.ts` |
| 3 | Output = idea + why (no full email drafts) | Live | `/admin/ideation` touch queue |
| 4 | Editable base layer in the dashboard | Live | `/admin/ideation/engine` |
| 5 | Per-company context (auto-drafted + editable) | Live | `/admin/ideation` (expand a prospect) |
| 6 | Robust JSON parsing | Live | `pipeline.ts` |
| 7 | `verify-run` test script | Tooling | `scripts/ideation/verify-run.ts` |

---

## 1. Flexible LLM provider
The engine chooses its provider by **which credential is set** — no code change to switch:

- **`OPENROUTER_API_KEY`** → OpenRouter (OpenAI-compatible gateway). **Currently active.** Default model `anthropic/claude-haiku-4.5`.
- **`ANTHROPIC_AUTH_TOKEN`** → Anthropic via a Claude **subscription** OAuth token (`claude setup-token`). Short-lived, not auto-refreshed — good for local/manual use.
- **`ANTHROPIC_API_KEY`** → Anthropic with a metered key. Keeps Anthropic prompt caching + adaptive thinking.

**Why:** the engine was blocked on having no Anthropic key. This lets it run off OpenRouter (or a subscription) instead.
**Switch providers:** set the env var in `.env.local` (local) and the Vercel project (prod). Remove `OPENROUTER_API_KEY` to fall back to the Anthropic path.
**Cost:** OpenRouter Haiku 4.5 ≈ **$0.11 per run** ($1/M in, $5/M out).

## 2. Cheaper default model
Default model is now **Claude Haiku 4.5** (was Opus). Override per provider with `ENGINE_MODEL`:
- OpenRouter slug, e.g. `anthropic/claude-opus-4.6`
- Anthropic bare id, e.g. `claude-opus-4-8`

Adaptive thinking is sent only for models that support it (4.6-gen and later on the Anthropic path); Haiku and the OpenRouter path skip it. Per-call output capped at 8,000 tokens (plenty for the JSON outputs).

## 3. Output = idea + why (not full emails)
Each suggested touch is now just **the idea** (what to do) **+ the why** (the signal it's built on) — no send-ready email/copy drafts. Shown in the `/admin/ideation` touch queue.

## 4. Editable base layer in the dashboard
The shared **base layer** moved from code files into the database, editable at **`/admin/ideation/engine`** (admin-only, hidden from per-company views). Four tabs:
- **Company Context** — who we are, differentiators, case studies, and the rules for what makes a good idea.
- **Data Assets** — real numbers the engine may cite (JSON-validated on save).
- **Knowledge Base** — the sales follow-up playbook.
- **Plays** — add / edit / enable / delete the proven moves the matcher chooses from.

**Edits apply to the next run — no deploy.** This is the lever for tuning idea quality.
Stored in the `engine_config` table; the engine reads it per run and falls back to the `config/` files if a row is missing.

## 5. Per-company context (auto-drafted, then editable)
Each prospect has its **own context layer**:
- **Auto-drafted** from that company's meetings/signals on the first run.
- **Editable** — expand a prospect row in `/admin/ideation`, then **Save** or **Regenerate from meetings**.
- **Injected as authoritative input** on every run; your edits persist and feed the next run.

This is the "personalized context per company on top of a shared base layer" model.

## 6. Robust JSON parsing
`llmJson` now tolerates models that wrap their JSON in preamble/trailing prose — it slices the outermost `{...}` / `[...]` and retries instead of failing the run. Important now that the base-layer rules are editable (varied rules → varied model output).

## 7. `verify-run` test script
`npx tsx scripts/ideation/verify-run.ts [prospectId]` runs the full pipeline for a prospect (GoDigit by default) and prints the run id, mode, idea/wild-card counts, and the ideas. Handy for sanity-checking after a base-layer or context edit.

---

## The two-layer model (how it fits together)
```
   base layer (shared, dashboard-edited)        per-company context (auto + edited)
   - company context / rules                     - this company's situation
   - data assets (numbers)              +        - auto-drafted from meetings
   - knowledge base                              - curated by you
   - play library
                         │                                  │
                         └──────────────  RUN  ─────────────┘
                                          │
                                        ideas (idea + why)
```

## Env vars (names only — set in `.env.local` + Vercel)
- `OPENROUTER_API_KEY` — use OpenRouter (active).
- `ANTHROPIC_AUTH_TOKEN` — subscription OAuth alternative.
- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` — Anthropic path (existing).
- `ENGINE_MODEL` — model override (must match the active provider's id format).

## Database
- **Migration `010_ideation_engine_config.sql`** (applied by hand + seeded): adds the `engine_config` table (base layer) and `prospects.context` (per-company context). Apply via the Supabase SQL editor; seed with `node scripts/ideation/seed-config.js`.

## Open items / next
- **Idea quality:** the ideas are still long and assumption-heavy — tune by editing **Company Context** + **Plays** in `/admin/ideation/engine` (no code).
- **Test data cleanup:** verify runs left test touches in the queue (can be cleared).
