"use client";

import {
  ArrowRight,
  Gift,
  Link2,
  Megaphone,
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WhatIsLinkrunner() {
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

      {/* ── The pillars ── */}
      <section className="grid gap-3 lg:grid-cols-3">
        {/* Deep links — full width, with routing visual */}
        <div className="rounded-3xl bg-violet-50 p-7 lg:col-span-3">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
            <Link2 className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Deep links</h3>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-gray-600">
            Unlimited deep links, a complete OneLink alternative, fully
            deferred deep link compatible. Every user lands on the right
            screen.
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
    </div>
  );
}
