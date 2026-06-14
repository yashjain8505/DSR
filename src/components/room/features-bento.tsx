"use client";

import { Sparkles } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Features — a glance at the real product (locked "Comp 3").          */
/*  Campaign analytics hero on top, then SKAN, audience builder and     */
/*  MCP as a trio. White product cards on the room's grey content area. */
/*  No shadows, no em dashes. Labels + SKAN tiers use --brand-primary.  */
/* ------------------------------------------------------------------ */

const brand = { color: "var(--brand-primary)" };

const CAMPAIGN_STATS = [
  { value: "25,000", label: "Clicks" },
  { value: "10,120", label: "Installs" },
  { value: "9,613", label: "Sign-ups" },
  { value: "$35,609", label: "Revenue" },
  { value: "2,114", label: "Paying users" },
];

const SKAN_STATS = [
  { value: "45,823", label: "Installs" },
  { value: "17.97%", label: "CV null rate" },
];

// Each channel's privacy-tier split (Tier 3 -> Tier 0).
const SKAN_TIERS = [
  { name: "Meta", seg: [6, 3, 1.6, 0.8] },
  { name: "Google", seg: [3, 4, 3, 1.5] },
  { name: "TikTok", seg: [4, 3, 2, 0.7] },
];

// Tier shade = brand colour mixed toward white, so it themes per room.
const TIER_PCT = [100, 60, 32, 14];
const tierStyle = (i: number) => ({
  backgroundColor: `color-mix(in srgb, var(--brand-primary) ${TIER_PCT[i]}%, white)`,
});

const COHORT_USERS = [
  { name: "Dev Silva", email: "dev.silva@example.com" },
  { name: "Ada Tanaka", email: "ada.tanaka@example.com" },
];

// The rest of the platform, shown as a labelled grid below the glances.
const MORE = [
  { title: "Deep links", sub: "Deferred and unlimited" },
  { title: "Referrals", sub: "Built-in referral tracking" },
  { title: "Postbacks", sub: "Clean events to ad partners" },
  { title: "Webhooks", sub: "Push events anywhere" },
  { title: "Remarketing", sub: "Bring users back" },
  { title: "Data export", sub: "Your data, your warehouse" },
  { title: "PII hashing", sub: "Privacy by default" },
  { title: "Fraud protection", sub: "Included at every tier" },
];

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-[11px] text-gray-400">{label}</p>
    </div>
  );
}

export function FeaturesBento() {
  return (
    <div className="space-y-3">
      {/* ── Hero: campaign analytics ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold" style={brand}>
            Campaign analytics
          </p>
          <span className="shrink-0 text-[11px] text-gray-400">
            Google search ad campaign
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
          {CAMPAIGN_STATS.map((s) => (
            <Stat key={s.label} value={s.value} label={s.label} />
          ))}
        </div>

        <svg
          viewBox="0 0 700 70"
          preserveAspectRatio="none"
          className="mt-3 block h-16 w-full"
        >
          <path
            d="M0,52 L70,46 L140,49 L210,34 L280,40 L350,26 L420,31 L490,18 L560,24 L630,9 L700,14"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
          />
          <path
            d="M0,60 L70,58 L140,59 L210,54 L280,56 L350,51 L420,53 L490,48 L560,50 L630,45 L700,47"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
          />
          <path
            d="M0,63 L70,61 L140,62 L210,57 L280,59 L350,54 L420,56 L490,51 L560,53 L630,48 L700,50"
            fill="none"
            stroke="#818cf8"
            strokeWidth="2.5"
          />
        </svg>
        <div className="mt-2 flex gap-4 text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Clicks
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#22c55e]" /> Installs
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#818cf8]" /> Sign Ups
          </span>
        </div>
      </div>

      {/* ── Trio: SKAN, audience builder, MCP ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* SKAN */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold" style={brand}>
            SKAN dashboard
          </p>
          <div className="mt-2.5 flex gap-5">
            {SKAN_STATS.map((s) => (
              <Stat key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            {SKAN_TIERS.map((ch) => (
              <div key={ch.name} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-right text-[10px] text-gray-400">
                  {ch.name}
                </span>
                <span className="flex h-2.5 flex-1 gap-0.5">
                  {ch.seg.map((f, i) => (
                    <span
                      key={i}
                      className="rounded-sm"
                      style={{ flexGrow: f, flexBasis: 0, ...tierStyle(i) }}
                    />
                  ))}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex gap-2.5 text-[9px] text-gray-400">
            {["Tier 3", "Tier 2", "Tier 1", "Tier 0"].map((t, i) => (
              <span key={t} className="flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={tierStyle(i)}
                />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Audience builder */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold" style={brand}>
            Audience builder
          </p>
          <div className="mt-2.5">
            <p className="text-[13px] font-semibold text-gray-900">
              Cart Abandoners
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">11,970 users</p>
          </div>
          <div className="mt-3 space-y-1.5 text-[11px]">
            {COHORT_USERS.map((u) => (
              <div
                key={u.name}
                className="flex items-center justify-between gap-2"
              >
                <span className="shrink-0 text-gray-700">{u.name}</span>
                <span className="min-w-0 truncate text-gray-400">
                  {u.email}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <span className="flex-1 rounded-lg border border-gray-200 py-1.5 text-center text-[11px] font-medium text-gray-600">
              Google Ads
            </span>
            <span className="flex-1 rounded-lg border border-gray-200 py-1.5 text-center text-[11px] font-medium text-gray-600">
              Meta Ads
            </span>
          </div>
        </div>

        {/* MCP for Claude */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={brand}
          >
            <Sparkles className="h-3.5 w-3.5" />
            MCP for Claude
          </p>
          <p className="mt-2.5 text-[11.5px] leading-5 text-gray-600">
            &ldquo;How did my campaigns perform last week?&rdquo;
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[10.5px] text-gray-400">Active</span>
            <span className="ml-auto rounded-md bg-gray-50 px-2 py-1 font-mono text-[10px] text-gray-500">
              lr_mcp_••••8f2a
            </span>
          </div>
        </div>
      </div>

      {/* ── Also in the platform ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-xs font-semibold" style={brand}>
          Also in the platform
        </p>
        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          {MORE.map((c) => (
            <div key={c.title}>
              <p className="text-sm font-medium text-gray-900">{c.title}</p>
              <p className="mt-0.5 text-[12px] leading-4 text-gray-400">
                {c.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
