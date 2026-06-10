-- Secondary/accent brand color for room theming (e.g. Bigul navy + neon green).
-- Run in the Supabase SQL editor (already applied via Management API 2026-06-10).

alter table rooms add column if not exists brand_secondary_color text;
