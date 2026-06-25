"use client";

import { useEffect } from "react";
import { EVENT_TYPES } from "@/lib/constants";

interface AnalyticsTrackerProps {
  roomId: string;
  visitorId: string | null;
}

// Pause counting after this much inactivity (no mouse / key / scroll / touch).
const IDLE_MS = 30_000;
// Flush accrued active time on this cadence so long sessions are captured even
// without a tab switch or unload.
const FLUSH_MS = 20_000;

/**
 * The room section currently at the centre of the viewport. Each stacked
 * section is rendered as `<section id={tabKey}>`, so the id is the section key
 * (e.g. "pricing", "features"). Active time is attributed to this section so an
 * admin can see exactly where a visitor's minutes were spent.
 */
function currentSection(): string {
  if (typeof document === "undefined") return "page";
  const mid = window.innerHeight / 2;
  const sections = document.querySelectorAll<HTMLElement>("section[id]");
  let fallback = "page";
  for (const el of sections) {
    if (!el.id) continue;
    const r = el.getBoundingClientRect();
    if (r.height === 0) continue;
    if (fallback === "page") fallback = el.id; // first real section
    if (r.top <= mid && r.bottom >= mid) return el.id;
  }
  return fallback;
}

/**
 * Invisible component that tracks page views and ACTIVE time on the room.
 *
 * "Active" time only accrues while the tab is visible AND the visitor has
 * interacted within the last IDLE_MS. A tab left open in the background, or
 * sitting idle in the foreground, does not inflate the number. Time is flushed
 * as `time_on_tab` events in deltas (seconds since the last flush), so the sum
 * of a visitor's events equals their real engaged time on the room.
 *
 * Uses `navigator.sendBeacon` for flushes so requests survive page teardown.
 */
export function AnalyticsTracker({ roomId, visitorId }: AnalyticsTrackerProps) {
  useEffect(() => {
    // Active time accrued but not yet sent, in ms.
    let accumulatedMs = 0;
    // Timestamp the current active window began accruing from (null = paused).
    let activeSince: number | null = null;
    let lastActivityAt = Date.now();
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let flushTimer: ReturnType<typeof setInterval> | null = null;

    const isVisible = () =>
      typeof document === "undefined" || document.visibilityState === "visible";

    // Fold the in-flight active window into the accumulator.
    function settle(now: number) {
      if (activeSince !== null) {
        accumulatedMs += now - activeSince;
        activeSince = null;
      }
    }

    function resume(now: number) {
      if (activeSince === null && isVisible()) activeSince = now;
    }

    function armIdleTimer() {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // Gone idle: stop accruing until the next interaction.
        settle(Date.now());
      }, IDLE_MS);
    }

    function flush(useBeacon: boolean) {
      settle(Date.now());
      const seconds = Math.round(accumulatedMs / 1000);
      if (seconds < 1) {
        // Keep sub-second remainder; resume accruing if still active.
        if (isVisible() && Date.now() - lastActivityAt < IDLE_MS) {
          activeSince = Date.now();
        }
        return;
      }
      accumulatedMs -= seconds * 1000;

      const payload = JSON.stringify({
        room_id: roomId,
        visitor_id: visitorId,
        event_type: EVENT_TYPES.TIME_ON_TAB,
        // v: 2 marks accurate, idle-excluded, per-section time. Legacy events
        // (no v) are from the old wall-clock tracker and are ignored everywhere.
        event_data: { seconds, tab: currentSection(), v: 2 },
      });

      if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics", payload);
      } else {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }

      // Resume accruing right away if the visitor is still engaged.
      if (isVisible() && Date.now() - lastActivityAt < IDLE_MS) {
        activeSince = Date.now();
      }
    }

    function onActivity() {
      const now = Date.now();
      lastActivityAt = now;
      resume(now);
      armIdleTimer();
    }

    function onVisibilityChange() {
      const now = Date.now();
      if (document.visibilityState === "hidden") {
        // Stop the clock and persist what we have before the tab is backgrounded.
        flush(true);
        if (idleTimer) clearTimeout(idleTimer);
      } else {
        lastActivityAt = now;
        resume(now);
        armIdleTimer();
      }
    }

    // --- init ---
    trackEvent(roomId, visitorId, EVENT_TYPES.PAGE_VIEW);
    resume(Date.now());
    armIdleTimer();

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ] as const;
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, onActivity, { passive: true })
    );
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", () => flush(true));
    flushTimer = setInterval(() => flush(true), FLUSH_MS);

    return () => {
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, onActivity)
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (idleTimer) clearTimeout(idleTimer);
      if (flushTimer) clearInterval(flushTimer);
      flush(true);
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
