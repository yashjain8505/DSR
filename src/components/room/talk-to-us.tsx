"use client";

import { useState } from "react";
import { MessageCircle, X, CalendarDays } from "lucide-react";

/** Cal.com booking link for the Linkrunner demos team. */
const CAL_LINK =
  "https://cal.linkrunner.io/team/demos/quick-demo?overlayCalendar=true";

/**
 * Floating "Talk to us" button pinned to the right edge of the room. Stays fixed
 * while the prospect scrolls; clicking it opens a small panel with a Cal.com
 * "Book a call" CTA (opens the booking page in a new tab).
 */
export function TalkToUs() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 top-1/2 z-40 -translate-y-1/2 sm:right-6">
      <div className="relative">
        {open && (
          <div className="absolute right-full top-1/2 mr-3 w-64 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold text-gray-900">
                Have a doubt? Talk to us
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mr-1 -mt-1 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Book a quick call with the Linkrunner team.
            </p>
            <a
              href={CAL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--brand-primary)" }}
            >
              <CalendarDays className="h-4 w-4" />
              Book a call
            </a>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Talk to us"
          className="flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          <MessageCircle className="h-5 w-5 shrink-0" />
          <span className="hidden sm:inline">Talk to us</span>
        </button>
      </div>
    </div>
  );
}
