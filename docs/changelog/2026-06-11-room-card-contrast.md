## 2026-06-11 - linkrunner-dsr — Increase card/tab contrast in rooms (borderless)

### Changed
Follow-up to today's neutral redesign: Yash flagged that cards blended into the background. Fixed within the no-border rule by widening the tint gap one step everywhere:

- Content-area page background `bg-gray-50` → `bg-gray-100` (`room-client-wrapper.tsx`), so white cards separate clearly.
- All white cards get a consistent base `shadow-sm` (overview content cards, integration cards, security sections, bento cards, getting-started sections).
- Inner groupings inside white cards `bg-gray-50` → `bg-gray-100` (flow steps, metrics, console panels, compliance/document/sub-processor/FAQ tiles, snapshot strip, docs callout, getting-started headers).
- Customer references wall inverted: white card container with gray-100 logo cells (was gray-on-gray after the page change).
- Pricing competitor cards white-with-tinted-header instead of gray-on-gray; nav hover states bumped to `gray-200/70` to stay visible on the darker page.

### Files touched
- `src/components/room/{room-client-wrapper,room-tabs,tab-overview,what-is-linkrunner,integrations,security-compliance,customers-references,tab-pricing,tab-getting-started,tab-meeting-brief,features-bento}.tsx`
- `docs/changelog/2026-06-11-room-card-contrast.md` (this file)

### Verified
- `npm run build` passes; only the pre-existing baseline lint errors remain.
- Playwright screenshots of /room/vama (What is Linkrunner, Customers & References) — cards and the active nav pill now read clearly against the background.
