"use client";

import { MessageCircle } from "lucide-react";

/** Cal.com booking link for the Linkrunner demos team. */
const CAL_LINK =
  "https://cal.linkrunner.io/team/demos/quick-demo?overlayCalendar=true";

/**
 * Floating "Talk to us" button pinned to the right edge of the room. Stays fixed
 * while the prospect scrolls; clicking it opens the Cal.com booking page directly
 * (new tab) — no intermediate panel.
 */
export function TalkToUs() {
  return (
    <a
      href={CAL_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Talk to us"
      className="fixed right-4 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-6"
      style={{ backgroundColor: "var(--brand-primary)" }}
    >
      <MessageCircle className="h-5 w-5 shrink-0" />
      <span className="hidden sm:inline">Talk to us</span>
    </a>
  );
}
