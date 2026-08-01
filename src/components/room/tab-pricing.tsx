"use client";

import { ArrowUpRight, CalendarCheck, Gift } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { DEMO_CALL_URL, PRICING_PAGE_URL, TRACKED_CTAS } from "@/lib/constants";
import type { Pricing } from "@/lib/types";

interface TabPricingProps {
  pricing: Pricing;
  companyName: string;
  roomId: string;
  visitorId: string | null;
}

/**
 * Fire-and-forget: records the click as a `link_click` event and raises the
 * real-time Slack alert. Only the CTA key is sent — the route resolves the
 * label server-side (see TRACKED_CTAS). `keepalive` so the request survives if
 * the click ever navigates the current tab instead of opening a new one.
 */
function trackDemoCtaClick(roomId: string, visitorId: string | null) {
  fetch("/api/analytics/cta-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      room_id: roomId,
      visitor_id: visitorId,
      cta: "pricing_demo_call",
    }),
    keepalive: true,
  }).catch(() => {
    /* analytics is best-effort; never block the booking link */
  });
}

/**
 * Pricing tab.
 *
 * A simple, consistent message rather than a per-room estimator: the first
 * 25,000 installs are free, standard rates live on the website, and a
 * customized quote comes from a demo call. The CTA uses DEMO_CALL_URL — the
 * same booking link as the room's floating "Talk to us" button.
 *
 * Clicking that CTA is the strongest buying signal the room produces, so it is
 * tracked and pinged to Slack in real time (`/api/analytics/cta-click`).
 *
 * `pricing.content` (admin markdown notes), if any, still renders underneath.
 */
export function TabPricing({
  pricing,
  companyName,
  roomId,
  visitorId,
}: TabPricingProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Pricing
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Usage-based, and built to flex with your volume.
        </p>
      </div>

      {/* Free installs — the headline offer */}
      <div className="rounded-2xl bg-[var(--brand-primary)] px-8 py-8 text-center text-white shadow-sm">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
          <Gift className="h-5 w-5" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
          To get you started
        </p>
        <p className="mt-1.5 text-3xl font-extrabold tracking-tight sm:text-4xl">
          First 25,000 installs free
        </p>
        <p className="mt-2 text-sm text-white/85">
          Go live and see the value before you pay anything.
        </p>
      </div>

      {/* Default pricing → website, with an offer to customize */}
      <div className="mt-5 rounded-2xl bg-white px-8 py-7 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900">Default pricing</h3>
        <p className="mt-2 text-[15px] leading-7 text-gray-600">
          You can check our standard pricing on the website — but we&apos;re
          more than happy to customize the quotation based on your volume.
        </p>
        <a
          href={PRICING_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
        >
          View pricing on our website
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      {/* CTA — book a demo call for a customized quote */}
      <div className="mt-5 rounded-2xl border border-gray-100 bg-[var(--brand-primary-light)] px-8 py-8 text-center shadow-sm">
        <h3 className="text-xl font-bold text-gray-900">
          Want a quote tailored to {companyName}?
        </h3>
        <p className="mt-2 text-[15px] text-gray-600">
          Book a quick demo call and we&apos;ll put together a customized
          quotation for your install volume.
        </p>
        <a
          href={DEMO_CALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackDemoCtaClick(roomId, visitorId)}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <CalendarCheck className="h-4 w-4" />
          {TRACKED_CTAS.pricing_demo_call.label}
        </a>
      </div>

      {/* Optional admin markdown notes */}
      {pricing.content && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <MarkdownRenderer content={pricing.content} />
        </div>
      )}
    </div>
  );
}
