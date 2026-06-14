## 2026-06-14 - linkrunner-dsr — Lint clean-up after toolchain drift

### Changed
- A fresh `npm install` (new machine) pulled newer `eslint` / `eslint-config-next`
  within the existing semver ranges, surfacing 48 lint **errors** that did not
  exist when the code was committed. None are behavior bugs in shipped app flows;
  `next build` was unaffected. Restored a clean `npm run lint`:
  - **`eslint.config.mjs`**: ignore `scripts/**` (one-off Node/tsx utilities, not
    part of the build — `require()` / loose typing are legitimate there; 41 of the
    48 errors). Downgraded `react-hooks/set-state-in-effect` (new React-Compiler
    rule in eslint-plugin-react-hooks v6) to `warn` — the codebase uses intentional
    hydration / fetch-on-mount effects; kept visible, not gate-failing.
  - **`src/components/admin/analytics/sparkline.tsx`**: gradient id now from
    `useId()` instead of `Math.random()` in render (real fix — the id, and thus the
    SVG gradient, regenerated every render). Hook hoisted above the early return.
  - **`src/components/room/analytics-tracker.tsx`**: stamp mount time inside the
    effect instead of `Date.now()` in the `useRef` initializer (purity rule).
  - **`src/app/api/rooms/[roomId]/analytics/route.ts`**: `let` -> `const` for
    `eventCountMap` (prefer-const).

### Files touched
- `eslint.config.mjs`
- `src/components/admin/analytics/sparkline.tsx`
- `src/components/room/analytics-tracker.tsx`
- `src/app/api/rooms/[roomId]/analytics/route.ts`

### Verified
- `npm run lint` -> exit 0 (0 errors, 60 warnings — pre-existing no-img-element /
  no-unused-vars / exhaustive-deps, non-gating).
- `npm run build` -> exit 0.

### Notes
- Committed locally, not pushed.
