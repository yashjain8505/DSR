"use client";

import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Code2,
  Gauge,
  Link2,
  Megaphone,
  MousePointerClick,
  Network,
  Radio,
  Route,
  ShieldCheck,
  Smartphone,
  Store,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";

interface FlowStep {
  icon: ReactNode;
  label: string;
  detail: string;
}

const FLOW_STEPS: FlowStep[] = [
  {
    icon: <Megaphone className="h-4 w-4" />,
    label: "Paid, organic, or owned touch",
    detail: "Meta, Google, TikTok, affiliate, QR, referral, influencer, or web",
  },
  {
    icon: <Link2 className="h-4 w-4" />,
    label: "Deep link + attribution context",
    detail: "The URL preserves campaign metadata, destination, and routing rules",
  },
  {
    icon: <Store className="h-4 w-4" />,
    label: "Install, open, or return",
    detail: "Users land in the right app screen while the MMP records the journey",
  },
  {
    icon: <BarChart3 className="h-4 w-4" />,
    label: "AI attribution + postbacks",
    detail: "Events are scored, explained, and sent back to partners in real time",
  },
];

interface OutcomeCard {
  icon: ReactNode;
  title: string;
  copy: string;
  metric: string;
}

const OUTCOMES: OutcomeCard[] = [
  {
    icon: <Gauge className="h-5 w-5" />,
    title: "Ask why a campaign moved",
    copy: "Linkrunner turns click, install, event, revenue, and partner data into plain answers for growth teams.",
    metric: "AI analysis",
  },
  {
    icon: <CircleDollarSign className="h-5 w-5" />,
    title: "Track the events that actually prove value",
    copy: "Measure signups, purchases, subscriptions, trials, referrals, cohorts, and custom milestones without starving the model.",
    metric: "50M events/mo included",
  },
  {
    icon: <Route className="h-5 w-5" />,
    title: "Keep routing and measurement together",
    copy: "One system handles deep links, deferred destinations, attribution windows, SKAN mapping, and partner callbacks.",
    metric: "MMP workflow",
  },
];

interface Capability {
  icon: ReactNode;
  title: string;
  detail: string;
}

const CAPABILITIES: Capability[] = [
  {
    icon: <MousePointerClick className="h-4 w-4" />,
    title: "Attribution engine",
    detail: "Installs, sessions, revenue, and custom events tied back to source, campaign, creative, and link.",
  },
  {
    icon: <Radio className="h-4 w-4" />,
    title: "Postback router",
    detail: "Clean partner-ready event sharing for ad networks, affiliates, analytics, and internal tools.",
  },
  {
    icon: <Smartphone className="h-4 w-4" />,
    title: "Deep link layer",
    detail: "Universal links, deferred destinations, QR flows, web-to-app handoffs, and campaign landing paths.",
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: "AI trust controls",
    detail: "Fraud signals, SKAN coverage, postback health, and data-quality gaps surfaced before spend drifts.",
  },
];

const SETUP_STEPS = [
  "Map acquisition sources and events",
  "Add SDK and server-side events",
  "Connect ad, affiliate, and analytics partners",
  "Let the AI monitor attribution health",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WhatIsLinkrunner({
  companyName = "Your app",
}: {
  companyName?: string;
}) {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-stretch">
        <div className="flex flex-col justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">
            <Network className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
            AI-native mobile measurement partner
          </div>
          <h2 className="max-w-2xl text-3xl font-bold leading-[1.08] text-gray-950 sm:text-4xl">
            Linkrunner is the world&apos;s first AI-native MMP for teams that need answers, not more dashboards.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
            A mobile measurement partner attributes installs and post-install
            events back to the marketing that created them. Linkrunner does that,
            then adds an AI layer that explains channel performance, flags broken
            postbacks, watches fraud signals, and tells you where growth is leaking.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Partner integrations" value="35+" />
            <Metric label="Monthly events included" value="50M" />
            <Metric label="Setup target" value="<10 min" />
          </div>
        </div>

        <ProductConsole companyName={companyName} />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-950">
              What an MMP has to get right
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Linkrunner sits between your app, your links, your ad partners,
              and your analytics stack so every acquisition signal has context.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Built for live MMP operations
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-4">
          {FLOW_STEPS.map((step, index) => (
            <div
              key={step.label}
              className="relative rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              {index < FLOW_STEPS.length - 1 && (
                <ArrowRight className="absolute right-3 top-5 hidden h-4 w-4 text-gray-300 lg:block" />
              )}
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[var(--brand-primary)] shadow-sm">
                {step.icon}
              </div>
              <p className="font-semibold text-gray-950">{step.label}</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {OUTCOMES.map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--brand-primary)]/10 text-[var(--brand-primary)]">
                {card.icon}
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                {card.metric}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-950">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">{card.copy}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-gray-200 bg-gray-950 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold text-white/60">
            What sits inside the AI-native MMP
          </p>
          <h3 className="mt-2 text-2xl font-bold leading-tight">
            The measurement layer your growth team normally stitches together manually.
          </h3>
          <div className="mt-6 space-y-3">
            {CAPABILITIES.map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-white/65">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-500">
                Typical rollout
              </p>
              <h3 className="mt-1 text-xl font-bold text-gray-950">
                Designed to produce trustworthy attribution quickly
              </h3>
            </div>
            <Code2 className="h-6 w-6 text-[var(--brand-primary)]" />
          </div>
          <div className="space-y-4">
            {SETUP_STEPS.map((step, index) => (
              <div key={step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-primary)] text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  {index < SETUP_STEPS.length - 1 && (
                    <div className="h-8 w-px bg-gray-200" />
                  )}
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-gray-950">{step}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {getSetupDetail(index)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-2xl font-bold text-[var(--brand-primary)]">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

function ProductConsole({ companyName }: { companyName: string }) {
  return (
    <div className="rounded-lg border border-gray-900 bg-gray-950 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
          AI attribution workspace
        </span>
      </div>

      <div className="rounded-lg bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">
              {companyName} acquisition
            </p>
            <p className="mt-1 text-lg font-bold text-gray-950">
              MMP command center
            </p>
          </div>
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ConsoleMetric label="Attributed installs" value="12.7K" tone="blue" />
          <ConsoleMetric label="Events scored" value="1.9M" tone="brand" />
          <ConsoleMetric label="D7 ROAS" value="2.8x" tone="green" />
        </div>

        <div className="mt-5 space-y-3">
          <ChannelRow label="Meta D7 ROAS" value="3.4x" width="82%" tone="brand" />
          <ChannelRow label="Google installs" value="4.1K" width="64%" tone="blue" />
          <ChannelRow label="Affiliate quality" value="72%" width="42%" tone="amber" />
          <ChannelRow label="QR-to-app opens" value="1.6K" width="26%" tone="green" />
        </div>

        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            AI data quality checks
          </div>
          <div className="grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
            <span>Postbacks healthy</span>
            <span>SKAN values mapped</span>
            <span>Fraud spike flagged</span>
            <span>Budget shift suggested</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsoleMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "brand" | "blue" | "green";
}) {
  const toneClass =
    tone === "green"
      ? "text-emerald-600"
      : tone === "blue"
        ? "text-sky-600"
        : "text-[var(--brand-primary)]";

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function ChannelRow({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: string;
  width: string;
  tone: "brand" | "blue" | "amber" | "green";
}) {
  const barClass =
    tone === "blue"
      ? "bg-sky-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "green"
          ? "bg-emerald-500"
          : "bg-[var(--brand-primary)]";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-600">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${barClass}`} style={{ width }} />
      </div>
    </div>
  );
}

function getSetupDetail(index: number): string {
  switch (index) {
    case 0:
      return "Define the sources, campaigns, attribution windows, and conversion events your team trusts.";
    case 1:
      return "Capture installs, opens, purchases, subscriptions, referrals, and server-confirmed events.";
    case 2:
      return "Send clean postbacks to Meta, Google, TikTok, affiliates, analytics, and internal BI.";
    default:
      return "Catch broken links, missing events, SKAN gaps, fraud spikes, and ROAS movement before the team asks.";
  }
}
