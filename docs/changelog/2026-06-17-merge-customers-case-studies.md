## 2026-06-17 - linkrunner-dsr — Merge Customers + Case Studies into one room tab

### Changed
- Combined the prospect room's "Our Customers & References" and "Case Studies"
  tabs into a single tab labelled **"Our Customers and Case Studies"**.
  - `src/lib/constants.ts`: renamed the `customers_references` label.
  - `src/components/room/room-tabs.tsx`:
    - `computeVisibleTabs` now shows the combined tab when EITHER
      `tab_customers_references_visible` OR `tab_case_studies_visible` is on
      (and no longer adds a separate "case_studies" tab).
    - The tab content renders the customer logo wall (unchanged) and, below it,
      all case studies (when any exist), separated by spacing.
- Admin management is unchanged: customer references and case studies are still
  edited/toggled separately in the room editor.

### Files touched
- `src/lib/constants.ts`, `src/components/room/room-tabs.tsx`

### Verified
- npm run build -> exit 0; npm run lint -> 0 errors. New label present in the
  built client bundle.

### Notes
- Case studies now appear in the combined tab whenever the room has any
  (the 7 defaults seed into every room); not gated on the old case_studies flag.
- Visual check pending (no browser connected to the agent this session).
