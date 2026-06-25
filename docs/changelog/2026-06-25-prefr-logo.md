# Prefr curated logo + Granola sync

- Synced the Prefr intro-call meeting (Jun 25, Karan Nagpal from prefr.com) into
  `granola_meeting_cache` (cache 40 → 41).
- Hosted the correct Prefr logo on Supabase (`assets/logos/prefr.png`), sourced
  from the official "Prefr: Instant Personal Loan" App Store icon
  (Dreamplug Technologies, com.prefr), 512×512 square.
- Registered `prefr.com` in `CURATED_LOGOS` (`src/lib/brand-colors.ts`) so the
  logo wins over auto-extraction and survives room regeneration. Applies
  automatically when the Prefr room is created from Granola.
