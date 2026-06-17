## 2026-06-17 - linkrunner-dsr — Email gate: drop name field, fix button legibility

### Changed
- `src/components/room/email-gate.tsx`:
  - Removed the optional "Your name" field (and its state) — the gate now only
    asks for the email.
  - Continue button is now deterministically legible: brand background via an
    inline style with a fallback (`var(--brand-primary, #4d4bf7)`) and forced
    white text (`text-white!`). Previously it relied on the variant's
    `text-white` surviving a class merge and on `--brand-primary` resolving; if
    the var didn't resolve the button went transparent (white text on the white
    card = unreadable). The fallback + forced text color fixes that.

### Files touched
- `src/components/room/email-gate.tsx`

### Verified
- `npm run build` -> exit 0; `npm run lint` -> 0 errors.

### Notes
- Visitor records will now have a null name (the email gate no longer collects it).
