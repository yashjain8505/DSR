"use client";

import { useState } from "react";
import { Search, ExternalLink } from "lucide-react";

const DASHBOARD_URL = "https://dashboard.linkrunner.io";
const INTEGRATIONS_URL = `${DASHBOARD_URL}/dashboard/integrations`;

/* ------------------------------------------------------------------ */
/*  Data — scraped from dashboard.linkrunner.io/dashboard/integrations */
/* ------------------------------------------------------------------ */

interface Integration {
  name: string;
  logo: string;
  description: string;
}

interface IntegrationCategory {
  title: string;
  items: Integration[];
}

const CATEGORIES: IntegrationCategory[] = [
  {
    title: "Ad Networks",
    items: [
      {
        name: "Google Ads",
        logo: "/logos/integrations/google.webp",
        description:
          "Reach a wider audience and optimize your ad campaigns with real-time data using Google Ads.",
      },
      {
        name: "Meta Ads",
        logo: "/logos/integrations/meta.webp",
        description:
          "Enhance your targeting and personalize ads for Meta's vast user base, driving better results.",
      },
      {
        name: "TikTok Ads",
        logo: "/logos/integrations/tiktok.webp",
        description:
          "Engage with TikTok's vibrant community through tailored ads and track performance effectively.",
      },
      {
        name: "Apple Search Ads",
        logo: "/logos/integrations/apple-search-ads.png",
        description:
          "Connect with high-intent users on the App Store through Apple Search Ads integration.",
      },
      {
        name: "Snapchat Ads",
        logo: "/logos/integrations/snapchat.png",
        description:
          "Connect with Snapchat's engaged audience through targeted ads and track performance effectively.",
      },
      {
        name: "LinkedIn Ads",
        logo: "/logos/integrations/linkedin.png",
        description:
          "Connect with professionals and businesses on LinkedIn through precise and impactful ad campaigns.",
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        name: "CleverTap",
        logo: "/logos/integrations/clevertap.webp",
        description:
          "Customer retention platform that helps personalize user experiences and boost engagement.",
      },
      {
        name: "MoEngage",
        logo: "/logos/integrations/moengage.webp",
        description:
          "AI-powered, personalized experiences across channels, enhancing customer journeys.",
      },
      {
        name: "Mixpanel",
        logo: "/images/integrations/mixpanel.png",
        description:
          "Advanced product analytics to understand user behavior and drive product decisions.",
      },
      {
        name: "Amplitude",
        logo: "/logos/integrations/amplitude.webp",
        description:
          "Comprehensive analytics to track user engagement and optimize digital experiences.",
      },
      {
        name: "PostHog",
        logo: "/logos/integrations/posthog.webp",
        description:
          "Open-source platform for product analytics, session recording, and experimentation.",
      },
      {
        name: "Google Analytics",
        logo: "/logos/integrations/google-analytics.webp",
        description:
          "Insights into website traffic and marketing effectiveness.",
      },
      {
        name: "Braze",
        logo: "/logos/integrations/braze.webp",
        description:
          "Customer engagement platform that delivers personalized messaging across various channels.",
      },
      {
        name: "Netcore",
        logo: "/logos/integrations/netcore.png",
        description:
          "Customer engagement platform enabling personalized omnichannel marketing and analytics.",
      },
      {
        name: "RevenueCat",
        logo: "/logos/integrations/revenuecat.png",
        description:
          "Track revenue and subscription data with automatic webhook-based event mapping.",
      },
    ],
  },
  {
    title: "Affiliate Partners",
    items: [
      {
        name: "AppSec Media",
        logo: "/logos/affiliates/appsecmedia-favicon.png",
        description:
          "Building an engine which yields increased revenue for publishers while enabling advertisers to get high performance.",
      },
      {
        name: "AVOW",
        logo: "/logos/affiliates/avow-favicon.png",
        description:
          "Increases your app's reach and engagement through mobile OEM advertising on devices and alternative app stores.",
      },
      {
        name: "Growthenger",
        logo: "/logos/affiliates/growthenger-favicon.png",
        description:
          "Subscription-app growth partner focused on acquisition, activation, retention, and monetization.",
      },
      {
        name: "Expanse Digital",
        logo: "/logos/affiliates/expansedigital-favicon.png",
        description:
          "ROI-driven performance marketing for D2C brands with data-backed optimizations, PPC, CRO, and full-funnel creative.",
      },
      {
        name: "Users Digital",
        logo: "/logos/affiliates/usersdigital-favicon.jpg",
        description:
          "Modern marketing agency specializing in tailor-suited user acquisition for online services.",
      },
      {
        name: "Fluencerz",
        logo: "/logos/affiliates/fluencers-favicon.ico",
        description:
          "Fastest-growing Influencer Marketing agency in India, connecting brands with relevant influencers through AI-driven data.",
      },
      {
        name: "VCommission",
        logo: "/logos/affiliates/vcommission-favicon.png",
        description:
          "Performance marketing network connecting advertisers with publishers for measurable results.",
      },
      {
        name: "Globale Media",
        logo: "/logos/affiliates/globalemedia-favicon.png",
        description:
          "Digital performance marketing company driving app installs and user acquisition at scale.",
      },
      {
        name: "Clickonik",
        logo: "/logos/affiliates/clickonik-favicon.webp",
        description:
          "Performance-driven digital marketing solutions for mobile app growth and user acquisition.",
      },
      {
        name: "Vellko",
        logo: "/logos/affiliates/vellko-favicon.png",
        description:
          "Mobile-first performance marketing platform connecting brands with quality traffic sources.",
      },
      {
        name: "XapAds",
        logo: "/logos/affiliates/xapads favicon.png",
        description:
          "Global performance marketing company delivering impactful mobile advertising campaigns.",
      },
      {
        name: "AIV Digital",
        logo: "/logos/affiliates/aivdigital-favicon.png",
        description:
          "Digital marketing agency specializing in app growth through performance-driven strategies.",
      },
      {
        name: "Thing or Two",
        logo: "/logos/affiliates/thingortwo-favicon.png",
        description:
          "Combining unique technology and creative thinking, providing strategic data-driven user acquisition solutions.",
      },
      {
        name: "MFilterIt",
        logo: "/logos/affiliates/mfilterit-favicon.png",
        description:
          "Trusted by leading global brands as a reliable partner for digital trust, safety, and performance validation.",
      },
      {
        name: "Promotion Bazaar",
        logo: "/logos/affiliates/promotionbazaar-favicon.png",
        description:
          "Plug-and-play systems tailored to each business's exact stage for high-quality lead generation.",
      },
      {
        name: "Admattic",
        logo: "/logos/affiliates/admattic-favicon.webp",
        description:
          "Performance marketing built on the belief that chasing outcomes, not clicks, drives real results.",
      },
      {
        name: "Digigrove",
        logo: "/logos/affiliates/DigiGrove-favicon.jpg",
        description:
          "Vast knowledge of media and business to benefit from different types of marketing models.",
      },
      {
        name: "Sandbox Ads",
        logo: "/logos/affiliates/appmontize.png",
        description:
          "Global mobile performance marketing network helping advertisers drive, analyze, and optimize app growth.",
      },
      {
        name: "Appmontize Media",
        logo: "/logos/affiliates/appmontize.png",
        description:
          "Performance-driven digital marketing solutions for app monetization and user acquisition at scale.",
      },
      {
        name: "Appflix",
        logo: "/logos/affiliates/appflix.png",
        description:
          "Performance marketing company headquartered in India specializing in mobile app promotion.",
      },
    ],
  },
];

const ALL_INTEGRATIONS = CATEGORIES.flatMap((c) => c.items);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const categories =
    activeCategory === "all"
      ? CATEGORIES
      : CATEGORIES.filter((c) => c.title === activeCategory);

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    items: search
      ? cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase())
        )
      : cat.items,
  })).filter((cat) => cat.items.length > 0);

  const totalCount = ALL_INTEGRATIONS.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            All Integrations
          </h2>
          <p className="text-sm text-gray-500">
            {totalCount} integrations across ad networks, analytics, and
            affiliate partners.
          </p>
        </div>
        <a
          href={INTEGRATIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 self-start rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          Open Dashboard
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {[
            { key: "all", label: "All" },
            { key: "Ad Networks", label: "Ad Networks" },
            { key: "Analytics", label: "Analytics" },
            { key: "Affiliate Partners", label: "Affiliate Partners" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
          />
        </div>
      </div>

      {/* Integration cards by category */}
      {filteredCategories.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-500">
          No integrations found.
        </div>
      ) : (
        filteredCategories.map((category) => (
          <section key={category.title}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              {category.title}
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({category.items.length})
              </span>
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.items.map((item) => (
                <IntegrationCard key={item.name} item={item} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Card                                                                */
/* ------------------------------------------------------------------ */

function IntegrationCard({ item }: { item: Integration }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      {/* Logo */}
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-gray-100">
        {imgError ? (
          <span className="text-sm font-bold text-gray-400">
            {item.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)}
          </span>
        ) : (
          <img
            src={`${DASHBOARD_URL}${item.logo}`}
            alt={item.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Text */}
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-gray-900">{item.name}</h4>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">
          {item.description}
        </p>
      </div>
    </div>
  );
}
