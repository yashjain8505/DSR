-- Add meeting_brief column to granola_meeting_cache
-- Stores structured meeting briefs (situation, pain points, next steps, etc.)
-- separate from the raw transcript stored in `summary`.

alter table granola_meeting_cache
  add column meeting_brief text not null default '';
