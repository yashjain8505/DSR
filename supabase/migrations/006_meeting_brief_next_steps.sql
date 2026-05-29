-- Add next_steps column to meeting_briefs table.
-- Stores actionable next-steps separately from the main recap content.

alter table meeting_briefs
  add column next_steps text not null default '';
