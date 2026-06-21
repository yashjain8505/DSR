## 2026-06-17 - linkrunner-dsr — Room tweaks: grid left-only, handshake, snap, recap dropdown

### Changed
- Grid-line background moved to the LEFT page index only (full-height nav); the
  right content area is plain again.
- Handshake: back to the yellow emoji, brightened (brightness/saturate + shadow).
- First scroll hero -> content is now a firm one-stop (snap-always on content).
- Restored the Recap dropdown in the index: "What we discussed so far" / "Next
  Steps" sub-items that scroll to anchors within the Recap section.
- Fixed Play Store links: Urban Money (com.urbanhmpl), Jumbo Gaming
  (com.joinjumbo.pro).

### Files touched
- `src/components/room/room-tabs.tsx`, `src/components/room/room-client-wrapper.tsx`, `src/components/room/room-hero.tsx`, `src/lib/constants.ts`

### Verified
- npm run build -> 0; npm run lint -> 0; room renders 200. Not visually verified.
