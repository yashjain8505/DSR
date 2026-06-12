## 2026-06-12 - linkrunner-dsr — Wire the sales follow-up knowledge base into the ideation engine

### Changed
- Added `config/sales-followup-knowledge-base.md` (Yash's evidence-graded research: 10 workstreams — cadence science, post-demo, demos, nurture/renewal, gone-dark revival, incumbent displacement, personalization, multithreading, gifting/offline, DSRs/video — plus a synthesis of 15 cross-cutting rules and a conflicts section).
- Injected it into the engine stage-by-stage (`src/lib/ideation/prompts.ts`):
  - **Matcher** gets the full KB as its operating manual (cadence, spacing, CTA style, recap structure, nurture clocks, de-risking ladders) with a hard rule: drafts may only cite statistics the KB labels "measured" with a named dataset — never folklore (NSEA "80% need 5+ follow-ups", WhatsApp "98% open rate", etc.). Nurture mode now explicitly targets the auto-renew NOTICE deadline, not the renewal date.
  - **Creative pass** gets only the synthesis section, framed as guardrails (no FOMO on stalled buyers, no incumbent attacks, no surveillance reveals, no unsourced stats) — the playbook stays hidden so wild cards stay wild.
  - **Critic** gets the synthesis as an evidence base plus new kill criteria (FOMO/pressure deepens no-decision odds 84% of the time; non-tribe-matched social proof; status-check/guilt framing; gift-gated meetings; unsourced statistics).
- Enabled prompt caching in `pipeline.ts` (`cache_control: ephemeral` on the system block) — the KB adds a ~45K-token stable prefix to the matcher; volatile content (date, signals) stays in the user message after the breakpoint.

### Files touched
- `config/sales-followup-knowledge-base.md` (new; copied from ~/Claude Code/sales-followup-knowledge-base.md)
- `src/lib/ideation/{prompts,pipeline}.ts`
- `docs/changelog/2026-06-12-ideation-knowledge-base.md` (this file)

### Verified
- `npm run build` + eslint pass. Runtime prompt-assembly test: KB loads (122K chars), matcher embeds the full KB, creative/critic embed only the synthesis, critic carries the new kill rules.
- LLM behavior with the KB in context is untested — still blocked on `ANTHROPIC_API_KEY`.
