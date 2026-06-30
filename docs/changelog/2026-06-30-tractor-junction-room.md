# Tractor Junction room (no Granola notes)

Created a prospect room for Tractor Junction directly (no Granola meeting), per
request, with the recap/notes section turned off so it isn't shown.

- Room `tractor-junction` created with all standard child rows seeded (empty
  meeting brief, default overview sub-tabs, empty pricing, default customer
  references + case studies). `hidden_sections = ["recap_discussed",
  "recap_next_steps"]` hides the "What we discussed" recap tab entirely.
- Logo sourced from tractorjunction.com (apple-touch-icon), flattened to a white
  256px square, hosted at `assets/logos/tractor-junction.png`. Brand primary
  extracted from the logo (#df3045).
- Registered `tractorjunction.com` in `CURATED_LOGOS` (`src/lib/brand-colors.ts`)
  for consistency with other customers.

The room is ready for manual editing in the admin.
