## 2026-06-13 - linkrunner-dsr — Ideation engine: output ideas + why, not full drafts

### Changed
- The engine no longer writes send-ready copy. Every stage now returns just the
  **IDEA** (the concrete move) + the **WHY** (the signal it's built on):
  - `prompts.ts`: dropped the `draft` field from the matcher (both
    `next_best_action` plays and the nurture timeline) and the critic; added an
    `idea` field to matcher plays/timeline. Removed drafting-rule references and
    the "cite stats inside a draft" wording.
  - `pipeline.ts`: touches now store `title = idea` + `why`; `draft` is left null.
    Wild-card promotion description uses the idea, not the old draft text.
  - admin `/admin/ideation`: expanded touch shows **Idea** + **Why**; removed the
    draft `<pre>` block and the Copy-draft button (plus now-unused imports/state).
  - `scripts/ideation/verify-run.ts`: prints the list of ideas + why, not a draft.
- No schema change — `touches.draft` is nullable and simply goes unused.

### Files touched
- `src/lib/ideation/{prompts,pipeline}.ts`
- `src/app/(admin)/admin/ideation/page.tsx`
- `scripts/ideation/verify-run.ts`
- `docs/changelog/2026-06-13-ideation-ideas-not-drafts.md` (this file)

### Verified
- `npm run build` passes; lint clean on changed files.
- Live run via OpenRouter (Run 2, GoDigit, ~76s): 3 plays + 3 wild cards, each
  returned as a one-line idea + a why tied to a specific signal — no email copy.

### Notes
- Idea **quality** (length, repetition, assumed numbers) is a separate pending
  pass — this change is only about the output *shape* (idea + why, no drafts).
- Touches from runs before this change still carry old `draft` text in the DB
  (now unrendered); the pending queue may show a mix until cleared.
- Not committed yet — held for the idea-quality iteration.
