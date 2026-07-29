## 2026-07-29 - linkrunner-dsr — Easemydeal: greeting name Marketing → Rahul

### Changed
- `/room/easemydeal` `contact_name` `"Marketing"` → `"Rahul"`. It had been auto-derived from `marketing@easemydeal.com`; the hero greeting now reads *"Dear Rahul & Easemydeal team,"*.

### Files touched
- `docs/changelog/2026-07-29-easemydeal-contact-name.md` (this file)
- Supabase data otherwise — one `rooms` row.

### Verified
- Data-level (the hero is client-rendered): `contact_name = "Rahul"`, which the greeting splits to first-name "Rahul".
