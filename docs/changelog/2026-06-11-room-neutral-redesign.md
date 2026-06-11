## 2026-06-11 - linkrunner-dsr — Room redesign: borderless, neutral gray, brand color only on hero + CTAs

### Changed
Applied Yash's new design rules across the entire prospect room template (so all existing and future rooms pick it up automatically):

- **No borders anywhere.** Cards are now white surfaces on the gray page background; inner groupings use tinted grays (gray-50/100); the comparison table uses zebra striping instead of cell borders; markdown tables are borderless with zebra rows.
- **Brand color removed everywhere except the hero landing section and CTAs.** The content area background went from `--brand-primary-light` to neutral `bg-gray-50`; nav active states, section icons, accent bars, gradient strips, timeline nodes, metric highlights, and the comparison "Linkrunner" column all went neutral (gray-900 for emphasis). CTAs (Explore Your Room, email-gate Continue, Open Dashboard, Trust Portal, Download, Open docs, Request Access/View all links) keep brand color.
- **Removed badges/chips/eyebrows:** "Live Room" header badge, "AI-native MMP" eyebrow pill, "Built for live MMP operations" chip, outcome metric chips, "Best value" badge, "AI attribution workspace" chip, "Owner" micro-label, "Compared to" chip footer, and de-uppercased eyebrow-style section headings.
- **Desaturated** the mock dashboard illustration (sky/emerald/amber bars → grays), compliance badge circles, savings callouts (green → gray), and getting-started icon tints (purple/green → gray).
- **Trimmed copy:** email-gate footer microcopy, docs-callout description, customers-references subline, duplicate "Typical rollout" eyebrow.

### Files touched
- All 20 components under `src/components/room/` that render visuals, plus `src/components/shared/markdown-renderer.tsx` and `src/app/(prospect)/room/[slug]/loading.tsx`.

### Verified
- `npm run build` passes; eslint clean on touched files (2 remaining errors in `analytics-tracker.tsx` / `room-client-wrapper.tsx` are pre-existing baseline, untouched lines).
- Playwright screenshots of /room/vama (hero, Recap, What is Linkrunner, Pricing) — hero keeps brand gradient; content area fully neutral; no borders/badges visible.

### Notes
- Design rules are standing policy from Yash (also stored in agent memory): no borders; tinted neutral grays; saturation reserved for CTAs; brand scheme only on landing; no badges/eyebrows; minimal non-repetitive text.
- Admin CMS (`src/app/(admin)`, `src/components/admin`) was NOT restyled — rules were stated for rooms. A follow-up could align the admin UI.
