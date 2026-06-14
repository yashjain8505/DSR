## 2026-06-13 - linkrunner-dsr — How It Works steps update; Features rolled back pending redesign

### Changed
- **How It Works** (`how-it-works.tsx`): removed the "Let the AI watch it" step. Steps are now setup-oriented: Drop in the SDK, Add your subdomain, Connect your channels, Map your events, Go live and iterate. Headline is now "Five steps to go live". "Book a call" links to https://meet.darshal.linkrunner.io.
- **Features** (`features-bento.tsx`): rolled back to the previous version (capability grid + AI signals and support cards) because the stripped rewrite dropped the actual product features. A proper redesign is being chosen from fresh mockups.

### Files touched
- `src/components/room/how-it-works.tsx`, `src/components/room/features-bento.tsx`
- `docs/changelog/2026-06-13-how-it-works-features-rollback.md` (this file)

### Verified
- `npm run build` passes; `npm run lint` clean on changed files.

### Notes
- Committed locally, not pushed.
