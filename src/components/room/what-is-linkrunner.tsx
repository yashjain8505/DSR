"use client";

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

export function WhatIsLinkrunner() {
  const brand = { color: "var(--brand-primary)" };

  return (
    <div>
      {/* Claim */}
      <h2 className="max-w-2xl text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
        Linkrunner is the world&apos;s first truly{" "}
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

      {/* Backing + scale */}
      <div className="mt-8 mb-4 h-px w-full bg-gray-200" />
      <div className="flex flex-wrap justify-between gap-2 text-sm text-gray-500">
        <span>Backed by Titan Capital, Sameer Sud, and 2AM VC.</span>
        <span>More than 250 customers across 10 countries.</span>
      </div>
    </div>
  );
}
