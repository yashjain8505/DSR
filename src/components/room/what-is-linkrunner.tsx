"use client";

import {
  Banknote,
  Zap,
  Timer,
  Link2,
  BarChart3,
  ShieldCheck,
  Radio,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface ProofBadge {
  label: string;
  sublabel: string;
}

const PROOF_BADGES: ProofBadge[] = [
  { label: "100+", sublabel: "apps live" },
  { label: "10M+", sublabel: "MAU tracked" },
  { label: "35+", sublabel: "integrations" },
  { label: "<5 min", sublabel: "to integrate" },
  { label: "Real-time", sublabel: "data" },
];

interface WhySwitchCard {
  icon: ReactNode;
  title: string;
  stat: string;
  description: string;
}

const WHY_SWITCH: WhySwitchCard[] = [
  {
    icon: <Banknote className="h-5 w-5" />,
    title: "Cost",
    stat: "5–10x cheaper",
    description:
      "Flat-rate pricing, not per-install fees. Your costs don't spike when campaigns work.",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Speed",
    stat: "Real-time",
    description:
      "See installs, events, and revenue as they happen — not 24 hours later.",
  },
  {
    icon: <Timer className="h-5 w-5" />,
    title: "Simplicity",
    stat: "10-min setup",
    description:
      "Three lines of code. No weeks-long onboarding, no dedicated BI team required.",
  },
];

interface CapabilityChip {
  icon: ReactNode;
  label: string;
}

const CAPABILITIES: CapabilityChip[] = [
  { icon: <Link2 className="h-3.5 w-3.5" />, label: "Deep Linking" },
  { icon: <BarChart3 className="h-3.5 w-3.5" />, label: "Attribution" },
  { icon: <Search className="h-3.5 w-3.5" />, label: "Real-time Analytics" },
  { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Fraud Detection" },
  { icon: <Radio className="h-3.5 w-3.5" />, label: "Postbacks" },
];

const VERTICALS = ["Fintech", "E-commerce", "Edtech", "Content", "Mobility"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WhatIsLinkrunner() {
  return (
    <div className="space-y-8">
      {/* Hero statement */}
      <div className="text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
          Mobile attribution that
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark, var(--brand-primary)))",
            }}
          >
            actually works.
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
          One SDK. One dashboard. Complete clarity on your acquisition funnel
          &mdash; at a fraction of what legacy MMPs charge.
        </p>

        {/* Capability chips */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {CAPABILITIES.map((cap) => (
            <span
              key={cap.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm"
            >
              <span style={{ color: "var(--brand-primary)" }}>{cap.icon}</span>
              {cap.label}
            </span>
          ))}
        </div>
      </div>

      {/* Proof strip */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 divide-x divide-gray-200 sm:grid-cols-5">
          {PROOF_BADGES.map((badge) => (
            <div
              key={badge.sublabel}
              className="flex flex-col items-center justify-center px-4 py-5"
            >
              <span
                className="text-xl font-extrabold tracking-tight sm:text-2xl"
                style={{ color: "var(--brand-primary)" }}
              >
                {badge.label}
              </span>
              <span className="mt-0.5 text-xs text-gray-500">
                {badge.sublabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Verticals */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Trusted across
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {VERTICALS.map((v) => (
            <span
              key={v}
              className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* Why teams switch */}
      <div>
        <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-gray-400">
          Why teams switch to Linkrunner
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {WHY_SWITCH.map((card) => (
            <div
              key={card.title}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-shadow duration-300 hover:shadow-lg"
            >
              {/* Subtle bg glow */}
              <div
                className="pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full opacity-[0.06] blur-2xl"
                style={{ backgroundColor: "var(--brand-primary)" }}
              />

              <div
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
                }}
              >
                <span style={{ color: "var(--brand-primary)" }}>
                  {card.icon}
                </span>
              </div>

              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {card.title}
              </p>
              <p
                className="mt-1 text-xl font-extrabold tracking-tight"
                style={{ color: "var(--brand-primary)" }}
              >
                {card.stat}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
