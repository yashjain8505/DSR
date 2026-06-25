"use client";

import {
  Activity,
  Apple,
  ArrowUpRight,
  BarChart3,
  Code2,
  CornerDownRight,
  Database,
  Globe,
  IndianRupee,
  Infinity as InfinityIcon,
  Link2,
  Megaphone,
  PlugZap,
  Route,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Target,
  TrendingDown,
  Users,
  Webhook,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Features — bento highlights + categorised feature grids.            */
/*  Three marquee tiles up top (one in --brand-primary), then Core      */
/*  Features, SDK-less Integration and API Reference as labelled        */
/*  strips. Every tile and card deep-links to its exact page on         */
/*  docs.linkrunner.io. No shadows, no em dashes.                       */
/* ------------------------------------------------------------------ */

const DOCS = "https://docs.linkrunner.io";

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  sub: string;
  href: string;
}

interface FeatureCategory {
  key: string;
  title: string;
  sub: string;
  items: FeatureItem[];
}

// Marquee capabilities. The first renders filled in the brand colour.
const HIGHLIGHTS: (FeatureItem & { feature?: boolean })[] = [
  {
    icon: CornerDownRight,
    title: "Deferred deep linking",
    sub: "Preserve the destination through install, every time",
    href: `${DOCS}/features/deferred-deep-linking`,
    feature: true,
  },
  {
    icon: ShieldCheck,
    title: "iOS SKAdNetwork",
    sub: "Apple-certified iOS install measurement",
    href: `${DOCS}/features/skadnetwork-integration`,
  },
  {
    icon: Sparkles,
    title: "MCP for Claude",
    sub: "Ask your attribution data in plain language",
    href: `${DOCS}/features/mcp`,
  },
];

const CATEGORIES: FeatureCategory[] = [
  {
    key: "core",
    title: "Core Features",
    sub: "The attribution and growth toolkit",
    items: [
      {
        icon: Globe,
        title: "Subdomain Setup",
        sub: "White-label every link on your own domain",
        href: `${DOCS}/features/subdomain-setup`,
      },
      {
        icon: Link2,
        title: "Deep Linking Setup",
        sub: "Route users to the exact in-app screen",
        href: `${DOCS}/features/deep-linking-setup`,
      },
      {
        icon: Route,
        title: "Web to App Journeys",
        sub: "Carry web context into the app seamlessly",
        href: `${DOCS}/features/web-to-app-journeys`,
      },
      {
        icon: Smartphone,
        title: "Link Redirection",
        sub: "Smart routing by platform and locale",
        href: `${DOCS}/features/link-redirection`,
      },
      {
        icon: Users,
        title: "Referral Code Tracking",
        sub: "Unique referral links per user, no limits",
        href: `${DOCS}/features/referral-codes`,
      },
      {
        icon: Store,
        title: "Custom Store Listings",
        sub: "Tie creatives to custom product pages",
        href: `${DOCS}/features/custom-store-listing`,
      },
      {
        icon: TrendingDown,
        title: "Uninstall Tracking",
        sub: "See churn cohorts across campaigns",
        href: `${DOCS}/features/uninstall-tracking`,
      },
      {
        icon: InfinityIcon,
        title: "Meta Install Referrer",
        sub: "Higher Android attribution accuracy",
        href: `${DOCS}/features/meta-install-referrer`,
      },
      {
        icon: Apple,
        title: "iOS Campaign Data",
        sub: "Aggregate iOS insight within Apple limits",
        href: `${DOCS}/features/ios-campaign-data-limitations`,
      },
      {
        icon: Webhook,
        title: "Webhooks",
        sub: "Stream attribution events to your stack",
        href: `${DOCS}/features/webhooks`,
      },
      {
        icon: Share2,
        title: "Social Intermediary Page",
        sub: "Reliable deep links from social apps",
        href: `${DOCS}/features/social-media-intermediary-page`,
      },
      {
        icon: Target,
        title: "Remarketing",
        sub: "Export cohorts to Google and Meta",
        href: `${DOCS}/features/remarketing`,
      },
    ],
  },
  {
    key: "sdkless",
    title: "SDK-less Integration",
    sub: "Attribute without shipping an SDK",
    items: [
      {
        icon: PlugZap,
        title: "SDK-less Overview",
        sub: "Measure installs with zero app changes",
        href: `${DOCS}/sdk-less/introduction`,
      },
      {
        icon: Smartphone,
        title: "Android (S2S)",
        sub: "Server-to-server install attribution",
        href: `${DOCS}/sdk-less/android-quickstart`,
      },
      {
        icon: Apple,
        title: "iOS (S2S)",
        sub: "Server-to-server iOS measurement",
        href: `${DOCS}/sdk-less/ios-quickstart`,
      },
      {
        icon: Code2,
        title: "API-only Setup",
        sub: "Integrate entirely over REST",
        href: `${DOCS}/sdk-less/api-reference`,
      },
    ],
  },
  {
    key: "api",
    title: "API Reference",
    sub: "Build directly on the platform",
    items: [
      {
        icon: Database,
        title: "Data APIs",
        sub: "Pull clicks, installs and revenue on demand",
        href: `${DOCS}/api-reference/data-apis`,
      },
      {
        icon: IndianRupee,
        title: "Revenue Tracking",
        sub: "Post purchase and subscription events",
        href: `${DOCS}/api-reference/revenue-tracking`,
      },
      {
        icon: Activity,
        title: "Event Capture",
        sub: "Send custom events at scale",
        href: `${DOCS}/api-reference/event-capture`,
      },
      {
        icon: Megaphone,
        title: "Campaign APIs",
        sub: "Create, edit and bulk-manage campaigns",
        href: `${DOCS}/api-reference/campaign-apis`,
      },
      {
        icon: BarChart3,
        title: "Reporting API",
        sub: "Automated performance reporting",
        href: `${DOCS}/api-reference/reporting-campaigns`,
      },
    ],
  },
];

// Brand-tinted icon tile (themes per room via --brand-primary).
const tileStyle = {
  backgroundColor: "color-mix(in srgb, var(--brand-primary) 12%, white)",
  color: "var(--brand-primary)",
};
const brandText = { color: "var(--brand-primary)" };

function HighlightTile({
  item,
}: {
  item: FeatureItem & { feature?: boolean };
}) {
  const Icon = item.icon;
  if (item.feature) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col rounded-2xl p-5 text-white transition-transform hover:-translate-y-0.5"
        style={{ backgroundColor: "var(--brand-primary)" }}
      >
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Icon className="h-5 w-5" />
          </span>
          <ArrowUpRight className="h-4 w-4 opacity-60 transition-opacity group-hover:opacity-100" />
        </div>
        <h3 className="mt-7 text-base font-bold">{item.title}</h3>
        <p className="mt-1 text-[12.5px] leading-5 text-white/85">{item.sub}</p>
      </a>
    );
  }
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300"
    >
      <div className="flex items-start justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={tileStyle}
        >
          <Icon className="h-5 w-5" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500" />
      </div>
      <h3 className="mt-7 text-base font-bold text-gray-900">{item.title}</h3>
      <p className="mt-1 text-[12.5px] leading-5 text-gray-500">{item.sub}</p>
    </a>
  );
}

function FeatureCard({ item }: { item: FeatureItem }) {
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-2.5"
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={tileStyle}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[12.5px] font-semibold text-gray-900">
          {item.title}
          <ArrowUpRight className="h-3 w-3 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </p>
        <p className="mt-0.5 text-[11px] leading-4 text-gray-400">{item.sub}</p>
      </div>
    </a>
  );
}

export function FeaturesBento() {
  return (
    <div className="space-y-3">
      {/* ── Highlights ── */}
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
        {HIGHLIGHTS.map((h) => (
          <HighlightTile key={h.title} item={h} />
        ))}
      </div>

      {/* ── Categorised strips ── */}
      {CATEGORIES.map((cat) => (
        <div
          key={cat.key}
          className="rounded-2xl border border-gray-200 bg-white p-5"
        >
          <div className="flex items-baseline gap-2.5">
            <p className="text-sm font-bold text-gray-900">{cat.title}</p>
            <p className="text-[12px] text-gray-400">{cat.sub}</p>
            <span className="ml-auto rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
              {cat.items.length}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            {cat.items.map((item) => (
              <FeatureCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      ))}

      {/* ── Docs link ── */}
      <a
        href={`${DOCS}/introduction`}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-gray-300 bg-white py-3 text-[12.5px] font-semibold transition-colors hover:border-gray-400"
        style={brandText}
      >
        Explore the full documentation
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    </div>
  );
}
