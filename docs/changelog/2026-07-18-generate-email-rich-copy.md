## 2026-07-18 - linkrunner-dsr — Generate Email: rich hyperlinked draft + drop cal link

### Changed
Reworked the Meetings "Generate Email" button (superseding the same-day plaintext version):
- **Room link is now a real hyperlink.** Clicking copies a formatted (text/html) email to
  the clipboard where the room link hides behind **"Linkrunner x {company}"** anchor text,
  and opens Gmail with recipients + subject prefilled. The operator pastes once (Cmd+V) and
  sends. A text/plain alternative is copied alongside for clients that ignore HTML.
- **Removed the cal.com follow-up link.** The sentence stays ("...happy to jump on a
  follow-up call to discuss further.") but is no longer a booking hyperlink.
- The button confirms the copy: it swaps to "Copied — paste in Gmail" (Check icon) for 8s.

### Why the paste step
Gmail's compose deep link (`?view=cm`) only accepts a plain-text body, so anchor-text
hyperlinks are impossible in a pure one-click flow. Getting the clickable
"Linkrunner x {company}" text requires putting rich HTML on the clipboard and pasting it —
a deliberate trade (one Cmd+V) chosen by the user over a plain auto-linked URL.

### Implementation notes
- Gmail window opens synchronously inside the click gesture (avoids popup blocking); the
  async clipboard write runs after and flags the row on success. Falls back to
  `writeText(plain)` when `ClipboardItem` is unavailable.
- Company/prospect names are HTML-escaped before interpolation into the body.

### Files touched
- `src/components/admin/granola-meetings-panel.tsx` — rewrote `handleGenerateEmail`
  (clipboard rich-copy + Gmail open), added `emailCopiedId` state, `Check` import, and the
  copied-state button label.

### Verified
- `npm run build` + `npm run lint` — 0 errors (only pre-existing warnings; net problem
  count unchanged).

### Notes
- Recipients (To) still prefill from the meeting's attendee emails, else `contact_email`,
  else blank. The Elixir Cards meeting has no attendee emails (built from a shared note that
  didn't expose them), so its To stays blank until those addresses are added to the record.
