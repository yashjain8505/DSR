## 2026-06-14 - linkrunner-dsr — Fixed blurry room logos (vama, khelomore, r-for-rabbit, sids-farm)

### Problem
Four rooms had blurry logos because `rooms.logo_url` pointed at tiny favicons
(Google `s2/favicons` at 32-40px, or a raw `favicon.ico`) that were upscaled
into the 48-64px hero/header logo boxes (and doubled again on retina).

### Changed (production data — already live, no deploy needed)
Sourced real high-resolution logos, normalised each to a crisp PNG (sharp,
`fit: inside` within 512px, no upscaling), uploaded to the public Supabase
`assets` bucket under `logos/<slug>.png`, and repointed `rooms.logo_url`:
- **vama** -> App Store icon for `com.vama.app` (512x512)
- **khelomore** -> App Store icon for `com.khelomore.pnpapp` (512x512). Note:
  the site's `logo512.png` is the unchanged Create React App boilerplate (the
  React atom), NOT the brand mark — do not use it.
- **r-for-rabbit** -> official site logo (2000x1000 -> 512x256)
- **sids-farm** -> brand logo from their Shopify CDN (263x238)

New URLs: `https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/<slug>.png`

### Verified
- Each normalised PNG was eyeballed to confirm it is the correct brand logo and crisp.
- All four public URLs return HTTP 200 `image/png`.
- `rooms.logo_url` updated for the four slugs (old favicon URLs recorded in the run log).

### Notes
- No app code changed; this is a data + storage change applied directly to prod
  via the service-role key (user-authorized). Logos are self-hosted on Supabase,
  so they do not depend on third-party favicon services or the pending deploy.
- Other rooms still use favicon-based logos; same approach applies if they look soft.
