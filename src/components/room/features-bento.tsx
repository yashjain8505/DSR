"use client";

import {
  Link2,
  BarChart3,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Code2,
  TrendingUp,
  IndianRupee,
  Headphones,
  Network,
  Smartphone,
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
  /** Grid span: "wide" = 2 cols, "tall" = 2 rows, "hero" = 2×2, default = 1×1 */
  span?: "wide" | "tall" | "hero";
  /** Visual accent style */
  accent?: "brand" | "dark" | "gradient" | "subtle";
}

const FEATURES: BentoCard[] = [
  {
    icon: <Link2 className="h-6 w-6" />,
    title: "Deep Linking",
    description:
      "One link handles iOS, Android, and web routing automatically. Supports deferred deep linking — users land on the right in-app screen even after installing.",
    metric: "1",
    metricLabel: "link, every platform",
    span: "wide",
    accent: "brand",
  },
  {
    icon: <Network className="h-6 w-6" />,
    title: "35+ Integrations",
    description:
      "Automated postbacks to Meta, Google, TikTok, Snapchat, and 30+ ad networks. Plus analytics platforms like Mixpanel, Amplitude, and CleverTap.",
    metric: "35+",
    metricLabel: "ad networks & tools",
    accent: "dark",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Real-Time Analytics",
    description:
      "See installs, events, and revenue updating live — not 24 hours later. Cohort analysis, retention curves, and ROAS by acquisition source.",
    accent: "subtle",
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "Fraud Detection",
    description:
      "Built-in anomaly detection flags click flooding, click injection, SDK spoofing, and device farms before bad traffic drains your budget.",
    accent: "subtle",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Multi-Touch Attribution",
    description:
      "Track the full user journey across channels. Last-click, first-click, and multi-touch models — see the complete picture.",
    accent: "subtle",
  },
  {
    icon: <Code2 className="h-6 w-6" />,
    title: "5-Minute SDK Setup",
    description:
      "Under 200KB. Three lines of code. Supports iOS, Android, React Native, Flutter, and Unity. The fastest MMP integration in the market.",
    metric: "<200",
    metricLabel: "KB SDK size",
    span: "wide",
    accent: "gradient",
  },
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: "SKAdNetwork 4.0",
    description:
      "Full SKAN compliance with coarse and fine-grained conversion values. iOS attribution without compromising user privacy.",
    accent: "subtle",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Revenue Tracking",
    description:
      "Attribute revenue to acquisition sources. In-app purchases, subscriptions, and ad revenue with automatic currency conversion.",
    accent: "subtle",
  },
];

const DIFFERENTIATORS: BentoCard[] = [
  {
    icon: <IndianRupee className="h-6 w-6" />,
    title: "Transparent Pricing",
    description:
      "No per-install fees that scale with your success. Flat-rate tiers — your costs don't spike when your campaigns work. Teams save 5–10× vs. legacy MMPs.",
    span: "wide",
    accent: "brand",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "India-First, Global-Ready",
    description:
      "Built for the Indian app ecosystem — UPI-first flows, regional language deep linking, Jio-era device fragmentation. Global infrastructure on AWS edge.",
    accent: "dark",
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Privacy Without Compromise",
    description:
      "No probabilistic fingerprinting, no device graphs. Every attribution is deterministic and consent-based. GDPR & CCPA compliant out of the box.",
    accent: "subtle",
  },
  {
    icon: <Headphones className="h-6 w-6" />,
    title: "Founder-Led Support",
    description:
      "No ticket queues. Our founding team handles onboarding, migration, and support directly. When something breaks at 2 AM, we pick up the phone.",
    accent: "subtle",
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
          subtitle="Everything you need to measure, attribute, and grow your mobile app."
        />
        <BentoGrid cards={FEATURES} />
      </div>
    </div>
  );
}

export function DifferentiatorsBento() {
  return (
    <div>
      <SectionHeader
        title="Why Teams Switch to Linkrunner"
        subtitle="Built different from day one — not another legacy MMP clone."
      />
      <BentoGrid cards={DIFFERENTIATORS} />
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
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-shadow duration-300 hover:shadow-lg ${spanClass} ${accentStyles.container}`}
    >
      {/* Background decoration */}
      <div className={`pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full opacity-[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.12] ${accentStyles.blob}`} />
      <div className={`pointer-events-none absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full opacity-[0.05] blur-xl ${accentStyles.blob}`} />

      {/* Content */}
      <div>
        {/* Icon */}
        <div
          className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${accentStyles.iconBg}`}
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

/* ------------------------------------------------------------------ */
/*  Accent style resolver                                              */
/* ------------------------------------------------------------------ */

interface AccentStyleSet {
  container: string;
  blob: string;
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
        blob: "bg-[var(--brand-primary)]",
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
        blob: "bg-white",
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
        blob: "bg-indigo-500",
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
        blob: "bg-gray-400",
        iconBg: "bg-gray-100",
        iconColor: "text-gray-700",
        title: "text-gray-900",
        text: "text-gray-500",
        metric: "text-gray-900",
        metricLabel: "text-gray-500",
      };
  }
}
