"use client";

import { useEffect, useState } from "react";
import { Download, Maximize2, X } from "lucide-react";

interface Deck {
  id: string;
  title: string;
  url: string;
}

/** Proxy a deck URL through our same-origin API so the iframe isn't CSP-blocked. */
function proxy(url: string, hash = ""): string {
  return `/api/assets/proxy?url=${encodeURIComponent(url)}${hash}`;
}

/**
 * Company Deck section: small first-page previews of each deck side by side.
 * Clicking a preview opens a large lightbox where the full deck can be explored;
 * a Download button is available on the card and in the lightbox.
 */
export function CompanyDeck({ decks }: { decks: Deck[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const active = openIdx !== null ? decks[openIdx] : null;

  // Close the lightbox on Escape.
  useEffect(() => {
    if (active === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIdx(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {decks.map((deck, i) => (
          <div
            key={deck.id}
            className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
          >
            {/* First-page preview — click to enlarge */}
            <button
              type="button"
              onClick={() => setOpenIdx(i)}
              className="relative block aspect-[4/3] w-full overflow-hidden bg-gray-100"
              aria-label={`Open ${deck.title}`}
            >
              <iframe
                src={proxy(deck.url, "#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0")}
                className="pointer-events-none absolute inset-0 h-full w-full border-0"
                title={`${deck.title} preview`}
                tabIndex={-1}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-3.5 w-3.5" />
                  Click to view
                </span>
              </div>
            </button>

            {/* Title + download */}
            <div className="flex items-center justify-between gap-2 p-3.5">
              <h3 className="text-sm font-bold text-gray-900">{deck.title}</h3>
              <a
                href={deck.url}
                download
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--brand-primary)" }}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setOpenIdx(null)}
        >
          <div
            className="relative flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
              <h3 className="text-base font-bold text-gray-900">{active.title}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={active.url}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setOpenIdx(null)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-50">
              <iframe
                src={proxy(active.url, "#toolbar=0&navpanes=0&view=FitH")}
                className="h-full w-full border-0"
                title={active.title}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
