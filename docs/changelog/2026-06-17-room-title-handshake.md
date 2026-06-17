## 2026-06-17 - linkrunner-dsr — Room tab title: handshake instead of em dash

### Changed
- `src/app/(prospect)/room/[slug]/page.tsx` generateMetadata: the browser tab
  title is now `<Company> 🤝 Linkrunner` instead of `<Company> — Linkrunner`
  (drops the em dash per the no-em-dash copy rule).

### Verified
- Dev server renders `<title>Hudle 🤝 Linkrunner</title>`.
- npm run build -> exit 0; npm run lint -> 0 errors.
