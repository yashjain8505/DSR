## 2026-07-21 - linkrunner-dsr — Babybillion: fix duplicated greeting name + low-res logo

### Changed
- `/room/babybillion` `contact_name` `"Sayantan, Sayantan"` → **`"Sayantan Pan"`**. The hero greeting (`room-hero.tsx:53-61`) splits `contact_name` on commas and takes each segment's first word, so the stored `"Sayantan, Sayantan"` rendered *"Dear Sayantan, Sayantan & Babybillion team,"*. With one clean name it reads *"Dear Sayantan & Babybillion team,"*.
- Replaced the logo: was a 128px Google-favicon URL (`google.com/s2/favicons?domain=babybillion.in&sz=128`), which is the pixelated icon that was showing. The site's own logo assets 404 on direct fetch (JS-injected paths), so sourced the **512x512 Play Store app icon** for `com.babybillion.superapp` instead (`play-lh.googleusercontent.com/...=s512`), mirrored into our `assets` bucket and trimmed to 447x458.

### Added to `set-room-brand.ts`
- `--contact 'Full Name'` flag, to set `contact_name` directly. Same tool now covers the two recurring room-identity fixes (brand + contact); the header documents the comma-split greeting gotcha that caused this bug.

### Files touched
- `scripts/granola/set-room-brand.ts` (`--contact` flag)
- `docs/changelog/2026-07-21-babybillion-greeting-logo.md` (this file)
- Supabase data otherwise — one `rooms` row; plus `assets/logos/babybillion.png` in storage.

### Verified
- `npx tsc --noEmit` clean; `npm run lint` 0 errors / 58 warnings (unchanged baseline).
- After the update: `contact_name = "Sayantan Pan"`, `logo_url` points at the hosted 447x458 PNG. `GET /room/babybillion` 200; new logo URL present, old favicon URL absent, `"Sayantan, Sayantan"` absent.
- The greeting is client-rendered (`room-hero` is a client component), so it is not in the SSR HTML — verification is at the data level: `contact_name` has no comma, so the split yields a single `"Sayantan"`. The two `Sayantan` strings remaining in the page are the brief's attendee line and the fixed `contact_name` prop, both singular.
- Play Store icon confirmed by eye before use: the Babybillion blue-and-yellow mascot — the same image as the old favicon, at full resolution. Brand primary `#00b0ff` already matches the mascot's blue, so it was left unchanged.
