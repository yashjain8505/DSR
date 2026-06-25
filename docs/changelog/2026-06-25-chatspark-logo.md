# ChatSpark curated logo + Granola sync

- Synced the ChatSpark (Aplo Care) intro-call meeting (Jun 25, with Ayush &
  Anurag from chatspark.in) into `granola_meeting_cache` (cache 39 → 40).
- Hosted the ChatSpark logo on Supabase (`assets/logos/chatspark.png`), padded
  the 600×300 banner to a square tile so it renders cleanly in the room's logo
  boxes.
- Registered `chatspark.in` in `CURATED_LOGOS` (`src/lib/brand-colors.ts`) so the
  logo wins over auto-extraction and survives room regeneration. Applies
  automatically when the ChatSpark room is created from Granola.
