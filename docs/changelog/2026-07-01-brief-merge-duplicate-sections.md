# Merge duplicate meeting-brief sections

Source notes sometimes have two headings that both normalize to the same
canonical section (e.g. "Background" and "Current Setup" both map to "Your
Situation"), which rendered the same heading twice in the recap.

`src/lib/meeting-brief.ts` (`parseBrief`): sections that resolve to the same key
are now merged into one, concatenating their items in source order, so a brief
never shows a duplicate heading.

Also removed the duplicate "Your Situation" already stored in the Savart room's
brief (data fix).
