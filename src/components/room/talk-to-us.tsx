"use client";

import { MessageCircle } from "lucide-react";

/** Cal.com booking link for the Linkrunner demos team. */
const CAL_LINK =
  "https://cal.linkrunner.io/team/demos/quick-demo?overlayCalendar=true";

/**
 * Small circular "Talk to us" button pinned to the bottom-right of the room.
 * Stays fixed while the prospect scrolls; clicking it opens the Cal.com booking
 * page directly (new tab).
 */
export function TalkToUs() {
  return (
    <a
      href={CAL_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Talk to us"
      title="Talk to us"
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
      style={{ backgroundColor: "var(--brand-primary)" }}
    >
      <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
    </a>
  );
}
