"use client";

import {
  BarChart3,
  Bot,
  Code2,
  Database,
  Globe,
  Headphones,
  IndianRupee,
  Link2,
  Lock,
  Network,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Feature data                                                       */
/* ------------------------------------------------------------------ */

interface BentoCard {
  icon: ReactNode;
  title: string;
  description: string;
  /** Optional large metric callout (e.g. "35+", "<200KB") */
  metric?: string;
  metricLabel?: string;
  /** Grid span: "wide" = 2 cols, "tall" = 2 rows, "hero" = 2x2, default = 1x1 */
  span?: "wide" | "tall" | "hero";
  /** Visual accent style */
  accent?: "brand" | "dark" | "gradient" | "subtle";
}

const FEATURES: BentoCard[] = [
  {
    icon: <Bot className="h-6 w-6" />,
    title: "AI Attribution Analyst",
    description:
      "Ask why CAC moved, which channel is creating higher-quality users, or where a postback stopped firing. Linkrunner reads the campaign and event graph for you.",
    metric: "AI",
    metricLabel: "built into the MMP",
    span: "wide",
    accent: "brand",
  },
  {
    icon: <Link2 className="h-6 w-6" />,
    title: "Deep Links + Deferred Routing",
    description:
      "One link handles iOS, Android, web, QR, influencer, referral, and paid campaigns. Users land on the right screen even after installing.",
    accent: "subtle",
  },
  {
    icon: <Network className="h-6 w-6" />,
    title: "Partner Postbacks",
    description:
      "Send conversion events back to Meta, Google, TikTok, Snap, affiliates, analytics, and BI from one normalized event stream.",
    metric: "35+",
    metricLabel: "partners and tools",
    accent: "dark",
  },
  {
    icon: <Database className="h-6 w-6" />,
    title: "Event Pipeline",
    description:
      "Track installs, opens, signups, purchases, subscriptions, referrals, and custom milestones without flattening your growth model.",
    metric: "50M",
    metricLabel: "events/mo included",
    span: "wide",
    accent: "gradient",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "ROAS + Cohort Reporting",
    description:
      "Read installs, revenue, retention, and payback by source, campaign, creative, deep link, and audience cohort as events arrive.",
    accent: "subtle",
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "Fraud + Data Quality",
    description:
      "Flag click flooding, suspicious conversion patterns, broken partner mappings, missing events, and spend spikes before budgets drift.",
    accent: "subtle",
  },
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: "SKAN + Privacy Attribution",
    description:
      "Map SKAN conversion values, support iOS privacy constraints, and keep measurement useful without relying on shady shortcuts.",
    accent: "subtle",
  },
  {
    icon: <Code2 className="h-6 w-6" />,
    title: "SDK + Server Events",
    description:
      "Start with a lightweight app SDK, then enrich attribution with server-confirmed purchases, subscriptions, and lifecycle events.",
    metric: "<10",
    metricLabel: "min setup target",
    accent: "subtle",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Campaign Intelligence",
    description:
      "Summaries, anomalies, and recommendations sit next to the metrics so teams can move budgets with context.",
    accent: "subtle",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Realtime Operations",
    description:
      "Monitor live campaign health, link routing, partner delivery, and revenue events while acquisition is still running.",
    accent: "subtle",
  },
];

const DIFFERENTIATORS: BentoCard[] = [
  {
    icon: <Bot className="h-6 w-6" />,
    title: "AI-native, not dashboard-native",
    description:
      "Legacy MMPs show reports. Linkrunner watches the measurement graph, explains changes, and points the team toward the next fix or budget move.",
    span: "wide",
    accent: "brand",
  },
  {
    icon: <IndianRupee className="h-6 w-6" />,
    title: "Measure more without being punished",
    description:
      "Teams should not hide useful events because every signal becomes a bill shock. Linkrunner is built for rich event tracking from day one.",
    accent: "dark",
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Privacy-aware by design",
    description:
      "SKAN, consent boundaries, fraud controls, and partner data rules are part of the workflow instead of a late compliance project.",
    accent: "subtle",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Built for Indian growth stacks",
    description:
      "Affiliate networks, QR-to-app journeys, UPI-heavy funnels, regional campaigns, and global paid channels can live in one measurement layer.",
    accent: "subtle",
  },
  {
    icon: <Headphones className="h-6 w-6" />,
    title: "Migration that ships",
    description:
      "The team helps map events, validate partner postbacks, compare old MMP data, and catch the boring issues that usually delay rollout.",
    accent: "subtle",
  },
];

const COMPARISON_ROWS = [
  {
    question: "Campaign question",
    legacy: "Open five reports and reconcile manually",
    linkrunner: "Ask the AI workspace and inspect the evidence",
  },
  {
    question: "Event depth",
    legacy: "Track fewer signals to control cost",
    linkrunner: "Send richer events so attribution gets smarter",
  },
  {
    question: "Partner debugging",
    legacy: "Opaque postback failures and slow tickets",
    linkrunner: "Health checks, alerts, and migration support",
  },
  {
    question: "Privacy operations",
    legacy: "SKAN and consent rules handled as side projects",
    linkrunner: "Privacy mapping lives inside the MMP workflow",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FeaturesBento() {
  return (
    <div className="space-y-10">
      {/* Features section */}
      <div>
        <SectionHeader
          title="Core Features"
          subtitle="The MMP layer: attribution, deep links, events, postbacks, privacy, fraud, and an AI analyst on top."
        />
        <BentoGrid cards={FEATURES} />
      </div>
    </div>
  );
}

export function DifferentiatorsBento() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="What Makes Us Different"
        subtitle="Linkrunner is built for teams that want MMP-grade measurement without legacy MMP drag."
      />
      <BentoGrid cards={DIFFERENTIATORS} />
      <ComparisonStrip />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h2>
      <p className="mt-1.5 text-sm text-gray-500 sm:text-base">{subtitle}</p>
    </div>
  );
}

function BentoGrid({ cards }: { cards: BentoCard[] }) {
  return (
    <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <BentoCardComponent key={card.title} card={card} />
      ))}
    </div>
  );
}

function BentoCardComponent({ card }: { card: BentoCard }) {
  const spanClass =
    card.span === "wide"
      ? "sm:col-span-2"
      : card.span === "tall"
        ? "sm:row-span-2"
        : card.span === "hero"
          ? "sm:col-span-2 sm:row-span-2"
          : "";

  const accentStyles = getAccentStyles(card.accent);

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-lg border p-6 transition-shadow duration-300 hover:shadow-lg ${spanClass} ${accentStyles.container}`}
    >
      {/* Content */}
      <div>
        {/* Icon */}
        <div
          className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${accentStyles.iconBg}`}
        >
          <span className={accentStyles.iconColor}>{card.icon}</span>
        </div>

        {/* Title */}
        <h3 className={`text-base font-semibold ${accentStyles.title}`}>
          {card.title}
        </h3>

        {/* Description */}
        <p className={`mt-2 text-sm leading-relaxed ${accentStyles.text}`}>
          {card.description}
        </p>
      </div>

      {/* Metric callout */}
      {card.metric && (
        <div className="mt-4 flex items-baseline gap-2">
          <span
            className={`text-3xl font-extrabold tracking-tight ${accentStyles.metric}`}
          >
            {card.metric}
          </span>
          {card.metricLabel && (
            <span className={`text-sm ${accentStyles.metricLabel}`}>
              {card.metricLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ComparisonStrip() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="grid gap-px bg-gray-200 md:grid-cols-[0.8fr_1fr_1fr]">
        <div className="bg-gray-50 p-4 text-xs font-semibold uppercase text-gray-500">
          Decision point
        </div>
        <div className="bg-gray-50 p-4 text-xs font-semibold uppercase text-gray-500">
          Legacy MMP
        </div>
        <div className="bg-[color:var(--brand-primary)]/10 p-4 text-xs font-semibold uppercase text-[var(--brand-primary)]">
          Linkrunner
        </div>
        {COMPARISON_ROWS.map((row) => (
          <div key={row.question} className="contents">
            <div className="bg-white p-4 text-sm font-semibold text-gray-900">
              {row.question}
            </div>
            <div className="bg-white p-4 text-sm leading-6 text-gray-600">
              {row.legacy}
            </div>
            <div className="bg-white p-4 text-sm font-medium leading-6 text-gray-900">
              {row.linkrunner}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Accent style resolver                                              */
/* ------------------------------------------------------------------ */

interface AccentStyleSet {
  container: string;
  iconBg: string;
  iconColor: string;
  title: string;
  text: string;
  metric: string;
  metricLabel: string;
}

function getAccentStyles(accent?: string): AccentStyleSet {
  switch (accent) {
    case "brand":
      return {
        container:
          "border-[color:var(--brand-primary)]/20 bg-[color:var(--brand-primary)]/[0.03]",
        iconBg: "bg-[color:var(--brand-primary)]/10",
        iconColor: "text-[var(--brand-primary)]",
        title: "text-gray-900",
        text: "text-gray-600",
        metric: "text-[var(--brand-primary)]",
        metricLabel: "text-gray-500",
      };
    case "dark":
      return {
        container: "border-gray-900 bg-gray-900 text-white",
        iconBg: "bg-white/10",
        iconColor: "text-white",
        title: "text-white",
        text: "text-gray-300",
        metric: "text-white",
        metricLabel: "text-gray-400",
      };
    case "gradient":
      return {
        container:
          "border-transparent bg-gradient-to-br from-[color:var(--brand-primary)]/5 via-white to-indigo-50",
        iconBg: "bg-[color:var(--brand-primary)]/10",
        iconColor: "text-[var(--brand-primary)]",
        title: "text-gray-900",
        text: "text-gray-600",
        metric: "text-[var(--brand-primary)]",
        metricLabel: "text-gray-500",
      };
    default:
      // "subtle"
      return {
        container: "border-gray-200 bg-white",
        iconBg: "bg-gray-100",
        iconColor: "text-gray-700",
        title: "text-gray-900",
        text: "text-gray-500",
        metric: "text-gray-900",
        metricLabel: "text-gray-500",
      };
  }
}
