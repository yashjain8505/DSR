"use client";

import { ShieldCheck, Sparkles, TrendingDown, Zap } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/*  Brand voice: confident, factual, no em dashes, no invented        */
/*  numbers. Add real figures where flagged.                          */
/* ------------------------------------------------------------------ */

const OUTCOMES: { icon: typeof Zap; title: string; body: string }[] = [
  {
    icon: TrendingDown,
    title: "Less wasted spend",
    // Real range from customer case studies (Playo 34%, Matiks/CashBook 46%).
    body: "34% to 46% lower CPI by shifting budget to what the data proves works.",
  },
  {
    icon: Zap,
    title: "Faster decisions",
    // TODO: add a measured figure here once verified.
    body: "See what changed and why, then act in minutes, not reports.",
  },
  {
    icon: ShieldCheck,
    title: "Attribution you trust",
    // TODO: add a measured figure here once verified.
    body: "Fewer blind spots and less fraud across every channel.",
  },
];

// CPI trend, indexed to 100 at month one (honest representative shape, not
// invented rupee values). Swap for a real customer series when available.
const CPI_INDEX: { y: number; v: string }[] = [
  { y: 20, v: "100" },
  { y: 65, v: "80" },
  { y: 110, v: "60" },
  { y: 155, v: "40" },
];
const CPI_POINTS = "64,28 168,52 272,82 376,108 480,130 584,150";

// Placeholder monograms. Replace with real investor logo files (local assets;
// external image hosts are blocked by the room CSP). Verify name spellings.
const INVESTORS: { mono: string; name: string }[] = [
  { mono: "TC", name: "Titan Capital" },
  { mono: "KB", name: "Kunal Bahl" },
  { mono: "SS", name: "Sameer Sud" },
  { mono: "2AM", name: "2AM VC" },
];

const LABEL = "mb-4 text-sm font-medium text-gray-400";
const CARD = "rounded-2xl bg-gray-50 p-6";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WhatIsLinkrunner() {
  return (
    <div className="space-y-10">
      {/* ── Hero ── */}
      <section className="text-center">
        <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
          The world&apos;s first truly AI-native MMP
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-gray-500">
          Attribution that turns into decisions, proven with customers and
          backed to scale.
        </p>
      </section>

      {/* ── What it gets you ── */}
      <section>
        <p className={LABEL}>What it gets you</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {OUTCOMES.map((o) => (
            <div key={o.title} className={CARD}>
              <div
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm"
                style={{ color: "var(--brand-primary)" }}
              >
                <o.icon className="h-[18px] w-[18px]" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                {o.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-gray-600">{o.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cost per install over time ── */}
      <section>
        <p className={LABEL}>Cost per install over time</p>
        <div className={CARD}>
          <div className="mb-5 flex items-baseline gap-2.5">
            <span
              className="text-2xl font-semibold"
              style={{ color: "var(--brand-primary)" }}
            >
              34% to 46% lower
            </span>
            <span className="text-xs text-gray-400">
              representative customer trend
            </span>
          </div>
          <svg
            viewBox="0 0 600 200"
            className="w-full"
            role="img"
            aria-label="Representative cost per install declining over six months"
          >
            {CPI_INDEX.map((g) => (
              <g key={g.v}>
                <line
                  x1="52"
                  y1={g.y}
                  x2="590"
                  y2={g.y}
                  className="stroke-gray-200"
                />
                <text
                  x="42"
                  y={g.y + 4}
                  textAnchor="end"
                  fontSize="12"
                  className="fill-gray-400"
                >
                  {g.v}
                </text>
              </g>
            ))}
            <polyline
              points={CPI_POINTS}
              fill="none"
              strokeWidth="3"
              style={{ stroke: "var(--brand-primary)" }}
            />
            {["M1", "M2", "M3", "M4", "M5", "M6"].map((m, i) => (
              <text
                key={m}
                x={64 + i * 104}
                y="180"
                textAnchor="middle"
                fontSize="12"
                className="fill-gray-400"
              >
                {m}
              </text>
            ))}
          </svg>
          <p className="mt-1 text-xs text-gray-400">
            CPI index, indexed to 100 at month one.
          </p>
        </div>
      </section>

      {/* ── AI that acts ── */}
      <section>
        <p className={LABEL}>AI that acts</p>
        <div className={CARD}>
          <div className="max-w-md space-y-2">
            <p
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: "var(--brand-primary)" }}
            >
              <Sparkles className="h-3.5 w-3.5" /> AI insight
            </p>
            <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[13px]">
              <span className="text-gray-700">Shift budget</span>
              <span className="text-gray-400">to Diwali_Meta</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[13px]">
              <span className="text-gray-700">Flag</span>
              <span className="font-medium text-amber-600">SDK outdated</span>
            </div>
          </div>
          <p className="mt-3.5 max-w-md text-sm leading-6 text-gray-600">
            An AI layer reads your data continuously and tells you what to do
            next, not just what happened.
          </p>
        </div>
      </section>

      {/* ── Backed by ── */}
      <section>
        <p className={LABEL}>Backed by</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {INVESTORS.map((inv) => (
            <div
              key={inv.name}
              className="flex items-center justify-center gap-2"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">
                {inv.mono}
              </div>
              <span className="text-sm font-medium text-gray-800">
                {inv.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Scale ── */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={`${CARD} text-center`}>
          <p className="text-2xl font-semibold text-gray-900">250+</p>
          <p className="mt-1 text-sm text-gray-500">customers</p>
        </div>
        <div className={`${CARD} text-center`}>
          <p className="text-2xl font-semibold text-gray-900">10</p>
          <p className="mt-1 text-sm text-gray-500">countries</p>
        </div>
        <div className={`${CARD} flex items-center justify-center text-center`}>
          <p className="text-base font-medium text-gray-900">
            Fully enterprise compliant
          </p>
        </div>
      </section>
    </div>
  );
}
