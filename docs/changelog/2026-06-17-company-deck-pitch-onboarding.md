## 2026-06-17 - linkrunner-dsr — Company Deck: new pitch deck + onboarding deck

### Changed
- Replaced the pitch deck and added an onboarding deck in the Company Deck
  section. Both are hosted PDFs embedded same-origin via /api/assets/proxy.
  - [data] Uploaded `decks/linkrunner-intro-deck-2026.pdf` (new pitch deck) and
    `decks/linkrunner-onboarding-deck.pdf` to the Supabase `assets` bucket.
  - [data] `company_deck` assets: existing asset retitled "Pitch Deck" pointing
    at the new intro deck (sort_order 0); new "Onboarding Deck" asset added
    (sort_order 1).
  - [code] `src/components/room/tab-overview.tsx`: the company_deck sub-tab now
    renders EVERY deck in the category as its own labelled block (heading +
    download + embed), in sort order — Pitch Deck on top, Onboarding Deck below
    (was: a single deck). Added a `DeckBlock` component.

### Files touched
- `src/components/room/tab-overview.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0. Both decks serve 200 application/pdf
  through /api/assets/proxy.

### Notes
- Decks are global assets, so the new pitch + onboarding decks show in every room's
  Company Deck tab.
