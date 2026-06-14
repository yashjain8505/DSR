"use client";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  "What is Linkrunner" — editorial split (locked mockup option 1).   */
/*  Brand voice: confident, factual, no em dashes. Accent + mission    */
/*  card use the room's --brand-primary. No shadows.                   */
/* ------------------------------------------------------------------ */

const NARRATIVE = [
  "Linkrunner started from a stubborn belief: a growth team should be able to trust an install number the same way they trust a credit card transaction. Clean, end to end, with the path visible.",
  "The legacy MMP world taught us the opposite. Setup takes weeks, dashboards hide the join, postbacks arrive late, and the only people who can debug it are the ones who built it.",
  "We rebuilt the stack with the install path as the spine. Click, deep link, SDK event, cohort, revenue, and postback live in one model. See the answer before the next campaign review.",
];

const VALUES = [
  {
    title: "Be honest",
    body: "Say the real thing kindly. Do not hide risk, inflate progress, or make someone decode what you mean.",
  },
  {
    title: "Care about the craft",
    body: "Small details matter here. Product, code, docs, and conversations should feel considered.",
  },
  {
    title: "Help each other win",
    body: "Share context, unblock people early, and leave fewer open loops for the next person.",
  },
  {
    title: "Keep learning",
    body: "Read, test, ask better questions, and bring useful tools into the way the team works.",
  },
];

export function WhatIsLinkrunner() {
  const brand = { color: "var(--brand-primary)" };

  return (
    <div>
      {/* Claim */}
      <h2 className="max-w-2xl text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
        Linkrunner is the world&apos;s first truly
        <br />
        <span style={brand}>AI-native MMP</span>.
      </h2>
      <p className="mt-3 max-w-2xl text-lg leading-7 text-gray-500">
        Attribution you can trust, with the whole install path visible.
      </p>

      <div className="my-9 h-px w-full bg-gray-200" />

      {/* Why we exist */}
      <p className="flex items-center gap-2 text-sm font-medium" style={brand}>
        <span
          className="inline-block h-2 w-2"
          style={{ backgroundColor: "var(--brand-primary)" }}
        />
        Why we exist
      </p>
      <h3 className="mt-3.5 text-2xl font-semibold leading-tight text-gray-900 sm:text-3xl">
        Stubborn <span style={brand}>belief and trust</span>
      </h3>

      <div className="mt-6 grid gap-6 lg:grid-cols-5 lg:items-start">
        <div className="space-y-3.5 text-[15px] leading-7 text-gray-600 lg:col-span-3">
          {NARRATIVE.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div
          className="rounded-2xl p-7 text-white lg:col-span-2"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/70">
            Our mission
          </p>
          <p className="mt-3.5 text-lg font-medium leading-snug">
            Make mobile attribution trustworthy. Accurate, transparent, and in
            real time, for the growth teams running real spend.
          </p>
        </div>
      </div>

      {/* What we value */}
      <div className="mt-12">
        <p className="flex items-center gap-2 text-sm font-medium" style={brand}>
          <span
            className="inline-block h-2 w-2"
            style={{ backgroundColor: "var(--brand-primary)" }}
          />
          What we value
        </p>
        <h3 className="mt-3.5 text-2xl font-semibold leading-tight text-gray-900 sm:text-3xl">
          Four lines we keep <span style={brand}>coming back to</span>
        </h3>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-gray-500">
          These show up in the product, the support threads, and the way we
          ship. They are how we stay honest with each other and the growth teams
          we work with.
        </p>
        <div className="mt-6 grid overflow-hidden rounded-2xl border border-gray-200 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <div
              key={v.title}
              className={cn(
                "p-7",
                i === 1 && "border-t border-gray-200 sm:border-t-0 sm:border-l",
                i === 2 && "border-t border-gray-200",
                i === 3 && "border-t border-gray-200 sm:border-l",
              )}
            >
              <p className="font-mono text-sm" style={brand}>
                0{i + 1}
              </p>
              <h4 className="mt-3 text-lg font-semibold text-gray-900">
                {v.title}
              </h4>
              <p className="mt-2 text-[15px] leading-7 text-gray-600">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Backing + scale */}
      <div className="mt-8 mb-4 h-px w-full bg-gray-200" />
      <div className="flex flex-wrap justify-between gap-2 text-sm text-gray-500">
        <span>Backed by Titan Capital, Sameer Sood, and 2AM VC.</span>
        <span>More than 250 customers across 10 countries.</span>
      </div>
    </div>
  );
}
