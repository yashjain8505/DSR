## 2026-06-17 - linkrunner-dsr — Customer references: remove Pronto, add 4

### Changed
- Removed Pronto from the customer reference logo wall; added August AI,
  Grapevine, Lakmé, and Ferry Scanners (512px logos hosted in Supabase assets).
- [data] Updated customer_references across all 3 rooms (removed Pronto, added the
  four). [code] Updated DEFAULT_CUSTOMER_REFERENCES in constants.ts for new rooms.

### Files touched
- `src/lib/constants.ts`

### Verified
- npm run build -> 0; npm run lint -> 0. Logos viewed to confirm correct brands
  (user confirmed Lakmé and Ferry Scanners).
