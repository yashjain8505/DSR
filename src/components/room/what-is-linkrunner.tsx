"use client";

import {
  BarChart3,
  Bot,
  Code2,
  Link2,
  Megaphone,
  Rocket,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const HERO_CARDS: { icon: ReactNode; title: string; copy: string }[] = [
  {
    icon: <BarChart3 className="h-4 w-4" />,
    title: "Attribution",
    copy: "Every install, event and rupee tied back to the campaign that earned it.",
  },
  {
    icon: <Link2 className="h-4 w-4" />,
    title: "Deep links",
    copy: "One link routes every user to the right screen — even after install.",
  },
  {
    icon: <Bot className="h-4 w-4" />,
    title: "AI analyst",
    copy: "Ask why ROAS moved and get the answer, not another dashboard.",
  },
];

const STATS: { value: string; label: string }[] = [
  { value: "35+", label: "ad & analytics integrations" },
  { value: "50M", label: "free events every month" },
  { value: "<10 min", label: "SDK setup" },
  { value: "99.5%", label: "affiliate fraud blocked" },
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
      {/* ── Editorial hero ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gray-950 px-6 py-12 sm:px-12 sm:py-14">
        {/* Brand glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 75% 90% at 50% -20%, var(--brand-primary) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <h2 className="mx-auto max-w-3xl text-center font-serif text-4xl leading-tight text-white sm:text-5xl">
            Know what <em className="italic">grows</em> your app.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base leading-7 text-white/65">
            Linkrunner is the AI-native mobile measurement partner &mdash;
            attribution, deep links and answers in one place.
          </p>

          {/* Glass cards */}
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {HERO_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl bg-white/[0.08] p-5 backdrop-blur-md"
              >
                <div className="flex items-center gap-2 text-white">
                  {card.icon}
                  <p className="font-semibold">{card.title}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  {card.copy}
                </p>
              </div>
            ))}
          </div>
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

      {/* ── Feature cards ── */}
      <section className="grid gap-3 sm:grid-cols-2">
        {/* One link, every channel */}
        <div className="rounded-3xl bg-violet-50 p-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
            <Megaphone className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            One link, every channel
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">
            Meta, Google, TikTok, affiliates, QR, influencers &mdash; all
            routed and measured the same way.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["Meta", "Google", "TikTok", "QR", "Influencer", "Web"].map(
              (ch) => (
                <span
                  key={ch}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm"
                >
                  {ch}
                </span>
              ),
            )}
          </div>
        </div>

        {/* Ask, don't dig */}
        <div className="rounded-3xl bg-sky-50 p-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Ask, don&rsquo;t dig
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">
            The AI analyst reads your campaign data so you don&rsquo;t have to.
          </p>
          <div className="mt-4 space-y-2">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-white px-3.5 py-2 text-xs text-gray-700 shadow-sm">
              Why did CAC rise last week?
            </p>
            <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-900 px-3.5 py-2 text-xs text-white">
              Meta CPMs +18%; your best ad set fatigued. Shift ₹40K to Google
              UAC.
            </p>
          </div>
        </div>

        {/* Track everything, free */}
        <div className="rounded-3xl bg-amber-50 p-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Track everything, free
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">
            50M events a month included. Signups, purchases, referrals &mdash;
            never trim events to control a bill.
          </p>
        </div>

        {/* Fraud blocked */}
        <div className="rounded-3xl bg-emerald-50 p-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Fraud blocked at the door
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">
            Click spam, bots and device farms filtered before you pay for
            them &mdash; included at every tier.
          </p>
        </div>
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
        <p className="mt-5 flex items-center gap-2 text-sm text-gray-500">
          <Code2 className="h-4 w-4 shrink-0 text-gray-400" />
          Migration from AppsFlyer, Adjust or Branch is handled by our team
          &mdash; existing links keep working.
        </p>
      </section>
    </div>
  );
}
