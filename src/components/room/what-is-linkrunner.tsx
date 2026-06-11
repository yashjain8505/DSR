"use client";

import {
  ArrowRight,
  BarChart3,
  Gift,
  Link2,
  Megaphone,
  Rocket,
  Smartphone,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Content — mirrors the five pillars on linkrunner.io                */
/* ------------------------------------------------------------------ */

const HERO_STATS: { value: string; label: string }[] = [
  { value: "1.7B+", label: "API requests handled" },
  { value: "100s", label: "of growth teams onboard" },
  { value: "25K", label: "free installs to start" },
];

const STATS: { value: string; label: string }[] = [
  { value: "35+", label: "ad & analytics integrations" },
  { value: "50M", label: "free events every month" },
  { value: "<10 min", label: "SDK setup" },
  { value: "99.5%", label: "affiliate fraud blocked" },
];

const ATTRIBUTION_METRICS: { label: string; value: string; delta: string }[] =
  [
    { label: "Installs", value: "73K", delta: "+14%" },
    { label: "ROAS", value: "92%", delta: "+11%" },
    { label: "D7 Retention", value: "41%", delta: "+6%" },
  ];

const GO_LIVE_STEPS: { title: string; sub: string }[] = [
  { title: "Add the SDK", sub: "3 lines of code" },
  { title: "Connect partners", sub: "Meta, Google & 35+ more" },
  { title: "Launch campaigns", sub: "links + QR + web-to-app" },
  { title: "Watch it attribute", sub: "installs & revenue, live" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WhatIsLinkrunner({
  companyName = "your team",
}: {
  companyName?: string;
}) {
  return (
    <div className="space-y-5">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gray-950 px-6 py-12 sm:px-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 75% 90% at 50% -20%, var(--brand-primary) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <h2 className="mx-auto max-w-3xl text-center font-serif text-4xl leading-tight text-white sm:text-5xl">
            Turn installs into <em className="italic">insights</em>.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-7 text-white/65">
            Linkrunner is the AI driven mobile measurement partner. Attribution,
            deep links, SKAN, referrals and remarketing in one dashboard built
            for daily campaign decisions.
          </p>
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white/[0.08] px-4 py-4 text-center backdrop-blur-md"
              >
                <p className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-white/55 sm:text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The five pillars ── */}
      <section className="grid gap-3 lg:grid-cols-3">
        {/* Deep links — wide, with routing visual */}
        <div className="rounded-3xl bg-violet-50 p-7 lg:col-span-2">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
            <Link2 className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Deep links</h3>
          <p className="mt-1.5 max-w-md text-sm leading-6 text-gray-600">
            Every user lands on the right screen. The link checks the device
            and routes in real time, even when the app is not installed yet.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="rounded-full bg-white px-3 py-1.5 text-gray-700 shadow-sm">
              App installed?
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-violet-300" />
            <span className="rounded-full bg-gray-900 px-3 py-1.5 text-white">
              Yes: deeplinked page
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-violet-300" />
            <span className="rounded-full bg-white px-3 py-1.5 text-gray-700 shadow-sm">
              No: store, then deferred deep link
            </span>
          </div>
        </div>

        {/* User attribution — with metric mock */}
        <div className="rounded-3xl bg-sky-50 p-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">User attribution</h3>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">
            Every install, event and rupee tied to the campaign that earned it.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {ATTRIBUTION_METRICS.map((m) => (
              <div
                key={m.label}
                className="rounded-xl bg-white px-2 py-2 text-center shadow-sm"
              >
                <p className="text-sm font-bold text-gray-900">{m.value}</p>
                <p className="text-[10px] font-semibold text-gray-700">
                  {m.delta}
                </p>
                <p className="text-[10px] text-gray-400">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Remarketing */}
        <div className="rounded-3xl bg-amber-50 p-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
            <Megaphone className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Remarketing</h3>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">
            Build audiences from real in-app behaviour and bring users back
            with retargeting campaigns.
          </p>
        </div>

        {/* iOS & SKAN */}
        <div className="rounded-3xl bg-emerald-50 p-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
            <Smartphone className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">iOS &amp; SKAN</h3>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">
            SKAN postbacks decoded into reports you can actually read. iOS
            measurement without the guesswork.
          </p>
        </div>

        {/* Referral tracking */}
        <div className="rounded-3xl bg-rose-50 p-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
            <Gift className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Referral tracking</h3>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">
            See who referred whom and reward them automatically. No in-house
            build needed.
          </p>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-white px-5 py-5 text-center shadow-sm"
          >
            <p className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* ── Go-live strip ── */}
      <section className="rounded-3xl bg-white p-7 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900">
            How {companyName} goes live
          </h3>
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-400">
            <Rocket className="h-4 w-4" />
            under a week
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {GO_LIVE_STEPS.map((step, i) => (
            <div key={step.title} className="rounded-2xl bg-gray-100 p-4">
              <p className="text-xs font-bold text-gray-400">{i + 1}</p>
              <p className="mt-1 font-semibold text-gray-900">{step.title}</p>
              <p className="mt-0.5 text-xs text-gray-500">{step.sub}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-gray-500">
          Migration from AppsFlyer, Adjust or Branch is handled by our team.
          Existing links keep working.
        </p>
      </section>
    </div>
  );
}
