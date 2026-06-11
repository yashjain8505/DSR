## 2026-06-11 - linkrunner-dsr — Pricing fits one screen, country flags, WIL v3 (five pillars), Features rebuilt

### Changed
- **Pricing page fits one viewport** (~900px): tightened header, estimator paddings, readout size (5xl → 4xl), tier/perk tile heights, and the comparison section spacing so the slider card AND both comparison cards are visible without scrolling.
- **Customers & References**: copy now "Trusted by 250+ customers across 10 countries." with a flag row (🇮🇳 🇺🇸 🇧🇷 🇮🇩 🇰🇷 🇳🇵 🇬🇷 + more), per Yash's list.
- **What is Linkrunner v3**: content rebuilt around linkrunner.io's five pillars — Deep links (with an installed?/deferred routing visual), User attribution (mini metric mocks), Remarketing, iOS & SKAN, Referral tracking. Hero copy now borrows the site's language ("Turn installs into insights", AI driven MMP, 1.7B+ API requests, 25K free installs). Em dashes removed from all prospect-visible copy (also fixed hero + meeting-brief sublines).
- **Features page rebuilt** (`FeaturesBento`): "Campaign answers in one glance" metric mocks (clicks/sessions/revenue/CTR), a 12-tile capability grid mirroring the site's signal list (OneLink-era set: attribution, deep links, deferred deep links, SKAN, audiences, postbacks, webhooks, cohorts, remarketing, data export, PII hashing, fraud), the site's anomaly-alert and builder-support chat mocks, and an SDK strip (React Native…Cordova). Removed the unused `DifferentiatorsBento`/`ComparisonStrip` exports.
- Case Studies tab left as-is (per Yash).

### Files touched
- `src/components/room/{tab-pricing,what-is-linkrunner,features-bento,customers-references,room-hero,tab-meeting-brief}.tsx`
- `docs/changelog/2026-06-11-pricing-fit-flags-wil-features.md` (this file)

### Verified
- `npm run build` passes; eslint: 0 errors on touched files (3 pre-existing img warnings).
- Playwright at 1440×900 on /room/godigit: pricing fully visible in one screen including both comparison cards; flags render; WIL v3 five-pillar layout renders; Features v2 renders (metrics, grid, mocks).
