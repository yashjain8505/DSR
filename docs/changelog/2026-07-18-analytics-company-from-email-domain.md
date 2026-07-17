## 2026-07-18 - linkrunner-dsr — Analytics: fill the blank COMPANY column from email domain

### Changed
- The Visitor Activity table showed `—` under COMPANY for every visitor. Root cause: the
  email gate collects only an email (`api/visitors` writes `company: null`), so
  `visitors.company` is null for every row and the admin dashboard passed that null through.
- `GET /api/admin/analytics` now derives a company label read-side from the visitor's
  work-email domain when `visitors.company` is null (`companyFromEmail`), so the column is
  populated for **all existing rows** immediately — no form change, no backfill migration.
  Personal/free domains (gmail, etc.) still resolve to null.

### Examples
- `komal@growth.zingroll.com` → "Zingroll"  ·  `naveen.raturi@tv9.com` → "Tv9"  ·
  `anahfatima.int@paymeindia.in` → "Paymeindia". Labels are the registrable domain name,
  title-cased — informative, if not always brand-perfect ("Z2adigital" vs "Z2A Digital").

### Files touched
- `src/app/api/admin/analytics/route.ts` — added `FREE_EMAIL_DOMAINS` + `companyFromEmail()`;
  changed the recent-visitor `company` field to `visitor.company ?? companyFromEmail(email)`.

### Verified
- `npm run build` + `npm run lint` — 0 errors (pre-existing warnings only).
- Derivation traced against the real visitor emails in the DB (matches the screenshot rows).

### Notes
- Read-side only. If you want the value persisted (e.g. for export or the per-room view),
  the same helper could also be applied in `POST /api/visitors` on write — not done here.
- A prettier label would need a domain→brand map or reusing room `company_name`; deferred.
