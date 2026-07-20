## 2026-07-20 - linkrunner-dsr — Freshyzo pre-meeting room (no call yet)

### Changed
- Created `/room/freshyzo` (`b13354fe-62b9-468b-b7d6-a12d893b7352`) for Freshyzo — app-based dairy subscription delivery (cow/buffalo milk, yogurt, paneer, ghee, khoya) operating in Raipur, Chhattisgarh, with live Android (`com.shyamdairyfarm.user`) and iOS (`6748257293`) apps.
- Added `scripts/granola/create-freshyzo-room.ts`.

### This is a pre-meeting room — no meeting brief
- There has been **no call**: `granola_meeting_cache` has 0 matches for Freshyzo (54 rows total) and no prior room existed. So the script seeds **no `meeting_briefs` row** and hides the Recap tab instead.
- Anything written into Recap would have been either invented or research presented as a conversation — the tab header is hardcoded to *"A recap of our conversation, prepared for your team"* (`tab-meeting-brief.tsx:45-49`), which would be false.
- **Hiding Recap requires BOTH sub-page keys**: `hidden_sections: ["recap_discussed", "recap_next_steps"]`. `computeVisibleTabs()` (`room-tabs.tsx:451-454`) special-cases `meeting_brief` — it stays visible while *either* sub-page is visible — so the intuitive `hidden_sections: ["meeting_brief"]` does **not** hide it and would have left an empty Recap tab in front of the prospect.
- When the first call happens: drop the two `recap_*` entries from `hidden_sections` and insert a `meeting_briefs` row. Nothing else needs to change.

### Brand assets — extraction failed, mirrored by hand
- `extractBrandAssets("freshyzo.com")` returned all nulls. The site has **no favicon** (`/favicon.ico` → 404) and references its logo by **relative** path (`assets/images/hero/logo.png`), which the extractor doesn't resolve.
- The script now fetches `https://freshyzo.com/assets/images/hero/logo.png` (631x204 RGBA, transparent) and mirrors it into our own `assets` bucket at `logos/freshyzo.png`, so the room doesn't hotlink the prospect's site.
- Colors read off the logo by hand: `#2fa84f` primary (green gradient wordmark). Secondary left `null` — the only non-green is neutral charcoal, not a distinct hue, which is the same call `extractBrandAssets` makes for single-hue logos.

### Files touched
- `scripts/granola/create-freshyzo-room.ts` (new)
- `docs/changelog/2026-07-20-freshyzo-room.md` (this file)
- Supabase data otherwise — `rooms`, `overview_sub_tabs`, `pricing`, `getting_started`, `customer_references`, `case_studies`, `room_access`; plus `assets/logos/freshyzo.png` in storage.

### Verified
- Script is idempotent; second run took the update branch and audited child rows — `overview_sub_tabs` 7, `pricing` 1, `getting_started` 1, `customer_references` 17, `case_studies` 7, `room_access` 1. No `<- MISSING`.
- `GET /room/freshyzo` returns 200 against `npm run dev`.
- Recap tab confirmed **absent**: zero hits for both `Recap` and `recap of our conversation` in the rendered HTML.
- All other tabs present (What is Linkrunner, Features, Pricing, Integrations, Security).
- Mirrored logo URL and `#2fa84f` both present in the rendered page.

### Notes
- Access is restricted to `@freshyzo.com` plus the automatic `@linkrunner.io` short-circuit. `support@freshyzo.com` is the **only** address published on the site — no individual contact, and no founder or leadership names are listed anywhere on the page. `contact_name` is therefore null; set it once a real contact is known.
- The homepage's stat counters all render `0` (happy families, downloads, years, products delivered), so there is no usable public scale figure for this prospect.
