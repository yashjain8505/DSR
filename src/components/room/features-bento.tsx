"use client";

import {
  AudioWaveform,
  Bell,
  Database,
  Download,
  Fingerprint,
  Gauge,
  Link2,
  Lock,
  Megaphone,
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

const GLANCE_METRICS: { label: string; value: string; delta: string }[] = [
  { label: "Clicks", value: "2.1M", delta: "+42%" },
  { label: "Sessions", value: "821K", delta: "+27%" },
  { label: "Revenue", value: "$18.6K", delta: "+31%" },
  { label: "CTR", value: "5.7%", delta: "+12%" },
];

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

const SDKS = [
  "React Native",
  "Expo",
  "Android",
  "iOS",
  "Flutter",
  "Web",
  "Capacitor",
  "Cordova",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FeaturesBento() {
  return (
    <div className="space-y-5">
      {/* ── Campaign answers in one glance ── */}
      <section className="rounded-3xl bg-white p-7 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Campaign answers in one glance
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Clicks to revenue in one dashboard, updating live.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GLANCE_METRICS.map((m) => (
            <div key={m.label} className="rounded-2xl bg-gray-100 px-4 py-4">
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
                {m.value}
              </p>
              <p className="text-xs font-semibold text-gray-600">
                {m.delta} this month
              </p>
            </div>
          ))}
        </div>
      </section>

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

      {/* ── AI alerts + human support ── */}
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-3xl bg-gray-950 p-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
            <Bell className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-white">
            Know what changed before the weekly review
          </h3>
          <div className="mt-4 rounded-2xl bg-white/[0.08] p-4 backdrop-blur-md">
            <p className="text-xs font-semibold text-white/60">
              Anomaly alert
            </p>
            <p className="mt-1.5 text-sm leading-6 text-white">
              Sudden 10% drop in ROAS yesterday. Possibly because you are
              still on an outdated SDK version.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-sky-50 p-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Support from the people building the product
          </h3>
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

      {/* ── SDK strip ── */}
      <section className="rounded-3xl bg-white p-7 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Integrate and go live today
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Native SDKs, under 200KB, under 10 minutes.
            </p>
          </div>
          <Lock className="hidden h-5 w-5 shrink-0 text-gray-300 sm:block" />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {SDKS.map((sdk) => (
            <span
              key={sdk}
              className="rounded-full bg-gray-100 px-3.5 py-1.5 text-xs font-medium text-gray-700"
            >
              {sdk}
            </span>
          ))}
        </div>
      </section>

      <p className="flex items-center gap-2 text-sm text-gray-500">
        <Database className="h-4 w-4 shrink-0 text-gray-400" />
        SOC 2 Type 2, ISO 27001 and GDPR compliant. Details in the Security
        &amp; Compliance tab.
      </p>
    </div>
  );
}
