"use client";

import { useState, useEffect, useRef } from "react";
import { EmailGate } from "@/components/room/email-gate";
import { RoomHero } from "@/components/room/room-hero";
import { RoomTabs } from "@/components/room/room-tabs";
import { AnalyticsTracker } from "@/components/room/analytics-tracker";
import { TalkToUs } from "@/components/room/talk-to-us";
import type { RoomWithContent } from "@/lib/types";

interface RoomClientWrapperProps {
  data: RoomWithContent;
}

/**
 * Client wrapper that handles the email gate flow, hero section,
 * and scroll-snap between hero and content.
 */
export function RoomClientWrapper({ data }: RoomClientWrapperProps) {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [gateCleared, setGateCleared] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check localStorage after hydration. Restricted rooms re-validate the
  // stored email against the allowlist — removed visitors fall back to the
  // gate, where the server enforces access on submit.
  useEffect(() => {
    const storedId = localStorage.getItem("dsr_visitor_id");
    const storedEmail = localStorage.getItem("dsr_visitor_email");

    if (!storedId) {
      setHydrated(true);
      return;
    }

    if (data.room.restrict_access !== true) {
      setVisitorId(storedId);
      setGateCleared(true);
      setHydrated(true);
      return;
    }

    if (!storedEmail) {
      setHydrated(true);
      return;
    }

    fetch("/api/rooms/access-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: data.room.id, email: storedEmail }),
    })
      .then((res) => res.json())
      .then((check) => {
        if (check.allowed) {
          setVisitorId(storedId);
          setGateCleared(true);
        } else {
          localStorage.removeItem("dsr_visitor_id");
          localStorage.removeItem("dsr_visitor_email");
        }
      })
      .catch(() => {
        /* fail closed — the gate shows and the server enforces on submit */
      })
      .finally(() => setHydrated(true));
  }, [data.room.id, data.room.restrict_access]);

  function handleAuthenticated(id: string) {
    setVisitorId(id);
    setGateCleared(true);
  }

  function scrollToContent() {
    contentRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // The first scroll out of the hero settles firmly on the content (the first
  // page); beyond that boundary the content scrolls freely. We only snap within
  // the hero -> content boundary zone, never inside the content itself.
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      const vh = el.clientHeight;
      const top = el.scrollTop;
      if (top > 4 && top < vh - 4) {
        el.scrollTo({ top: top < vh / 2 ? 0 : vh, behavior: "smooth" });
      }
    }, 90);
  }

  if (!hydrated) {
    return null;
  }

  return (
    /* Full-height scroll container. A scroll handler firmly settles the first
       scroll on the content; the content then scrolls freely. */
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-[100dvh] overflow-y-auto"
    >
      {!gateCleared && (
        <EmailGate
          roomId={data.room.id}
          companyName={data.room.company_name}
          onAuthenticated={handleAuthenticated}
        />
      )}

      {/* Hero landing section */}
      <div>
        <RoomHero
          companyName={data.room.company_name}
          logoUrl={data.room.logo_url}
          contactName={data.room.contact_name ?? null}
          onScrollDown={scrollToContent}
        />
      </div>

      {/* Tab content area */}
      <div
        ref={contentRef}
        className="min-h-screen bg-gray-100"
      >
        <div className="mx-auto max-w-[1600px] px-4 pb-28 pt-6 sm:px-6 sm:py-10">
          <RoomTabs data={data} visitorId={visitorId} />
        </div>
      </div>

      <AnalyticsTracker roomId={data.room.id} visitorId={visitorId} />

      {gateCleared && <TalkToUs />}
    </div>
  );
}
