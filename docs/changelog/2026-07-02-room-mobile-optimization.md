# Prospect room: mobile optimization

Made the prospect room genuinely mobile-first. The desktop layout is unchanged.

- **New mobile navigation** (`room-tabs.tsx`): replaced the cramped horizontal
  scroll bar with a sticky "current section" bar (p.0X + section name) and a
  "Sections" button that opens a full-screen menu listing every section
  (numbered, active highlighted, recap sub-items). Sections get `scroll-mt-16`
  on mobile so headings clear the sticky bar.
- **Hero** (`room-hero.tsx`): smaller logo tiles (h-14) and emoji, heading down
  to 26px, tighter greeting, wider team cards (max-w-sm) on phones.
- **Markdown tables** (`markdown-renderer.tsx`): wrapped in an `overflow-x-auto`
  container with a min-width so wide comparison tables scroll instead of being
  clipped on mobile.
- **Integrations** (`integrations.tsx`): category tabs now scroll horizontally
  instead of wrapping.
- **Content container** (`room-client-wrapper.tsx`): tighter top padding and
  `pb-28` bottom clearance so the floating "Talk to us" button never covers the
  last content.
- **Features** (`features-bento.tsx`): bumped tiny card text to a readable size
  on mobile.

Verified: production `npm run build` passes and the room SSRs 200; live-preview
was blocked by a local Turbopack dev bug unrelated to these changes.
