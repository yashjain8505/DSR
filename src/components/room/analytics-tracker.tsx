"use client";

import { useEffect, useRef } from "react";
import { EVENT_TYPES } from "@/lib/constants";

interface AnalyticsTrackerProps {
  roomId: string;
  visitorId: string | null;
}

/**
 * Invisible component that tracks page views and time on page.
 *
 * - On mount: sends a page_view event.
 * - On unmount / page hide: sends a time_on_tab event for total time spent.
 *
 * Uses `navigator.sendBeacon` for the unload event so the request
 * isn't cancelled by the browser tearing down the page.
 */
export function AnalyticsTracker({ roomId, visitorId }: AnalyticsTrackerProps) {
  const mountedAt = useRef<number>(0);

  useEffect(() => {
    // Stamp mount time inside the effect (Date.now() in the ref initializer
    // runs during render, which the react-hooks purity rule forbids).
    mountedAt.current = Date.now();

    // Track page view
    trackEvent(roomId, visitorId, EVENT_TYPES.PAGE_VIEW);

    function sendTimeOnPage() {
      const seconds = Math.round((Date.now() - mountedAt.current) / 1000);
      if (seconds < 1) return;

      const payload = JSON.stringify({
        room_id: roomId,
        visitor_id: visitorId,
        event_type: EVENT_TYPES.TIME_ON_TAB,
        event_data: { seconds, tab: "page" },
      });

      // Prefer sendBeacon for reliability during page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics", payload);
      } else {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    }

    // visibilitychange fires when the user switches tabs or minimises.
    // pagehide fires when the user navigates away or closes the tab.
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        sendTimeOnPage();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", sendTimeOnPage);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", sendTimeOnPage);
      sendTimeOnPage();
    };
  }, [roomId, visitorId]);

  return null;
}

/* ------------------------------------------------------------------ */

function trackEvent(
  roomId: string,
  visitorId: string | null,
  eventType: string,
  eventData?: Record<string, unknown>
) {
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      room_id: roomId,
      visitor_id: visitorId,
      event_type: eventType,
      event_data: eventData ?? null,
    }),
  }).catch(() => {
    /* analytics is best-effort */
  });
}
