## 2026-06-17 - linkrunner-dsr — Customer logos link to Play Store

### Changed
- Customer reference logos on the customer wall are now clickable links to each
  customer's Play Store page (opens in a new tab). Added
  CUSTOMER_PLAY_STORE_LINKS (name -> URL) in constants.ts; CustomersReferences
  wraps each logo in a link when a URL exists.

### Files touched
- `src/lib/constants.ts`, `src/components/room/customers-references.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0. URLs sourced via play.google.com search.

### Notes
- A few links are best-guess and should be verified: CashBook (gn.cashbook),
  Urban Money (Partner app), Jumbo Gaming (com.joinjumbo), Zavo (com.zavo.app).
