"use client";

import {
  AudioWaveform,
  Bell,
  Download,
  Fingerprint,
  Gauge,
  Link2,
  Megaphone,
  MessageCircle,
  Network,
  Route,
  ShieldCheck,
  Smartphone,
  Users,
  Webhook,
} from "lucide-react";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Content — mirrors "one platform for the signals growth teams use"  */
/*  on linkrunner.io                                                   */
/* ------------------------------------------------------------------ */

const CAPABILITIES: { icon: ReactNode; title: string; sub: string }[] = [
  {
    icon: <Gauge className="h-4 w-4" />,
    title: "Attribution",
    sub: "Installs and events, by campaign",
  },
  {
    icon: <Link2 className="h-4 w-4" />,
    title: "Deep links",
    sub: "Right screen, every time",
  },
  {
    icon: <Route className="h-4 w-4" />,
    title: "Deferred deep links",
    sub: "Survive the app store detour",
  },
  {
    icon: <Smartphone className="h-4 w-4" />,
    title: "SKAN",
    sub: "iOS postbacks, decoded",
  },
  {
    icon: <Users className="h-4 w-4" />,
    title: "Audiences",
    sub: "Cohorts built from behaviour",
  },
  {
    icon: <Network className="h-4 w-4" />,
    title: "Postbacks",
    sub: "Clean events to ad partners",
  },
  {
    icon: <Webhook className="h-4 w-4" />,
    title: "Webhooks",
    sub: "Push events anywhere",
  },
  {
    icon: <AudioWaveform className="h-4 w-4" />,
    title: "Cohorts",
    sub: "Retention and payback curves",
  },
  {
    icon: <Megaphone className="h-4 w-4" />,
    title: "Remarketing",
    sub: "Bring users back",
  },
  {
    icon: <Download className="h-4 w-4" />,
    title: "Data export",
    sub: "Your data, your warehouse",
  },
  {
    icon: <Fingerprint className="h-4 w-4" />,
    title: "PII hashing",
    sub: "Privacy by default",
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: "Fraud protection",
    sub: "Included at every tier",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FeaturesBento() {
  return (
    <div className="space-y-5">
      {/* ── Capability grid ── */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            One platform for every growth signal
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {CAPABILITIES.map((cap) => (
            <div
              key={cap.title}
              className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                {cap.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {cap.title}
                </p>
                <p className="mt-0.5 text-xs leading-4 text-gray-500">
                  {cap.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI signals + human support ── */}
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-3xl bg-gray-950 p-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
            <Bell className="h-3.5 w-3.5" />
            AI signals
          </span>
          <p className="mt-4 text-base leading-7 text-white/85">
            Linkrunner watches your campaigns around the clock. If ROAS
            suddenly drops 10% because of an outdated SDK or a broken link,
            the AI signal pings you immediately. You fix it in hours, not at
            the weekly review, and lose no revenue.
          </p>
        </div>

        <div className="rounded-3xl bg-sky-50 p-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
            <MessageCircle className="h-3.5 w-3.5" />
            Support in 2 hours, max
          </span>
          <p className="mt-4 text-base leading-7 text-gray-700">
            We set up a shared WhatsApp and Slack group with your team. No
            long email threads, just a quick text at any point, answered by
            the people building the product.
          </p>
          <div className="mt-4 space-y-2">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-white px-3.5 py-2 text-xs text-gray-700 shadow-sm">
              Hi, which events should we add?
            </p>
            <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-900 px-3.5 py-2 text-xs text-white">
              For your app: signUp, purchaseMade and addToCart. Want me to set
              them up?
            </p>
            <p className="text-[11px] text-gray-400">Darshil, 2m ago</p>
          </div>
        </div>
      </section>
    </div>
  );
}
