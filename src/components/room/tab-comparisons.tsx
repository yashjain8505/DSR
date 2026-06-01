"use client";

import { CheckCircle2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Comparison data                                                    */
/* ------------------------------------------------------------------ */

type CompetitorKey = "appsflyer" | "adjust" | "branch";

interface ComparisonRow {
  dimension: string;
  linkrunner: string;
  appsflyer: string;
  adjust: string;
  branch: string;
}

const COMPETITOR_LABELS: Record<CompetitorKey, string> = {
  appsflyer: "AppsFlyer",
  adjust: "Adjust",
  branch: "Branch",
};

const ROWS: ComparisonRow[] = [
  {
    dimension: "Onboarding",
    linkrunner: "Forward-deployed engineers on-site in your office. Live in under a week.",
    appsflyer: "Self-serve setup wizard. Enterprise gets CSM. Realistic timeline: 2-4 weeks.",
    adjust: "Developer-led integration with docs. Enterprise onboarding: $5K-$25K extra.",
    branch: "Implementation team develops onboarding plan. Deep link setup is primary focus.",
  },
  {
    dimension: "Support",
    linkrunner: "One text away. Slack, WhatsApp, calls. Most issues fixed in under 2 hours.",
    appsflyer: "Email tickets. 2-hour SLA for critical (Enterprise). 12-hour for medium priority.",
    adjust: "Ticket-based support. SLA not publicly stated. Help Center documentation.",
    branch: "Ticket-based. Premium Support is a paid add-on with weekend coverage.",
  },
  {
    dimension: "Cost",
    linkrunner: "Under 1% of marketing budget. $0.007-$0.01 per install. Transparent pricing.",
    appsflyer: "Up to 20% of marketing budget. $0.03-$0.07/conversion. Median contract: $88K/yr.",
    adjust: "Quote-based only. Per monthly tracked user. Median contract: $44K/yr.",
    branch: "Quote-based only. Volume credit system. Median contract: $43K/yr.",
  },
  {
    dimension: "Contract",
    linkrunner: "Postpaid, monthly. No upfront, cancel anytime. No annual lock-in.",
    appsflyer: "Enterprise: 12-month minimum. 5-15% annual price escalation. Overage at 2-3x base.",
    adjust: "Annual contracts standard. Multi-year for better rates. 3-5% annual escalation.",
    branch: "Annual enterprise contracts. 3-7% renewal escalators. Non-trivial overage fees.",
  },
  {
    dimension: "Fraud Detection",
    linkrunner: "Included at every tier. Click spam, bots, device farms, SDK spoofing - all built-in.",
    appsflyer: "Protect360 is a paid add-on ($10K-$50K+/yr). Basic ProtectLITE is free but limited.",
    adjust: "Fraud Prevention Suite is a paid add-on. Adds 15-30% to contract value.",
    branch: "Basic detection in Performance tiers. ML-based pattern detection.",
  },
  {
    dimension: "Custom Features",
    linkrunner: "Linkrunner is happy to build any custom features your team may need.",
    appsflyer: "Standard product. Custom development not available. Feature requests go to roadmap.",
    adjust: "Standard product. AppLovin ecosystem integration. No custom dev.",
    branch: "Standard product. Enterprise can request priority features.",
  },
  {
    dimension: "Compliance",
    linkrunner: "SOC 2 Type II, ISO 27001, GDPR compliant.",
    appsflyer: "SOC 2 Type II, ISO 27001, GDPR, CCPA. Enterprise-grade compliance.",
    adjust: "GDPR, CCPA compliant. AppLovin privacy framework.",
    branch: "SOC 2 Type II, GDPR, CCPA. Privacy-first positioning.",
  },
  {
    dimension: "Scale",
    linkrunner: "We handle more than 15M installs and 2-3B API calls per month.",
    appsflyer: "Proven at enterprise scale. 12,000+ brands. Largest MMP by market share.",
    adjust: "Global scale via AppLovin infrastructure. AXON processes 1B+ devices.",
    branch: "100,000+ apps, 3.5B users. Strongest in deep linking at scale.",
  },
  {
    dimension: "AI Features",
    linkrunner: "AI analyst built into the MMP. Explains changes, flags issues. Own MCP server and CLI.",
    appsflyer: "PredictSK for LTV prediction. MCP server for LLM access. No AI assistant.",
    adjust: "AXON 2.0 for ad auction optimization. Generative AI for creatives (via AppLovin).",
    branch: "Ivy AI assistant for recommendations. MCP for LLM integration.",
  },
  {
    dimension: "SDK Size",
    linkrunner: "Under 200KB. 3 lines of code. Under 10 minutes to integrate.",
    appsflyer: "~600KB+ impact on APK. Full integration typically takes 1-2 weeks.",
    adjust: "~50-60KB Android, ~600KB iOS. Standard integration timeline.",
    branch: "~220KB iOS. Handles 6,000+ deep link edge cases. Moderate setup.",
  },
  {
    dimension: "Integrations",
    linkrunner: "35+ partners. Meta, Google, TikTok, Snap, LinkedIn, Apple Search Ads, analytics tools.",
    appsflyer: "5,000+ technology partners. Widest integration ecosystem in the market.",
    adjust: "211 partners (142 technology, 69 channel). AppLovin ecosystem.",
    branch: "80+ platform integrations. All major SANs certified.",
  },
  {
    dimension: "Real-time Data",
    linkrunner: "Installs, events, and revenue update live. No batching delay.",
    appsflyer: "Near real-time for most data. Some reports have up to 24-hour delay.",
    adjust: "Near real-time with processing lag. Datascape dashboards.",
    branch: "Real-time for deep link analytics. Attribution data has processing delay.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface TabComparisonsProps {
  competitors: string[];
}

export function TabComparisons({ competitors }: TabComparisonsProps) {
  const enabled = competitors.filter(
    (c): c is CompetitorKey => c in COMPETITOR_LABELS
  );

  if (enabled.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        No comparisons configured.
      </div>
    );
  }

  const colCount = enabled.length + 2; // dimension + competitors + linkrunner

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">How We Compare</h2>
        <p className="mt-1 text-sm text-gray-500">
          See how Linkrunner stacks up against legacy MMPs
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[600px] text-sm">
          {/* Header */}
          <thead>
            <tr>
              <th className="w-[160px] bg-white p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400" />
              {enabled.map((key) => (
                <th
                  key={key}
                  className="bg-gray-50 p-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  {COMPETITOR_LABELS[key]}
                </th>
              ))}
              <th
                className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-white"
                style={{ backgroundColor: "var(--brand-primary)" }}
              >
                Linkrunner
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {ROWS.map((row, i) => (
              <tr
                key={row.dimension}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}
              >
                {/* Dimension */}
                <td className="border-t border-gray-100 p-4 align-top font-bold text-gray-900">
                  {row.dimension}
                </td>

                {/* Competitor cells */}
                {enabled.map((key) => (
                  <td
                    key={key}
                    className="border-t border-gray-100 p-4 align-top text-gray-500"
                  >
                    {row[key]}
                  </td>
                ))}

                {/* Linkrunner cell */}
                <td
                  className="border-t p-4 align-top font-medium text-gray-900"
                  style={{
                    borderColor: "color-mix(in srgb, var(--brand-primary) 15%, #e5e7eb)",
                    backgroundColor:
                      i % 2 === 0
                        ? "color-mix(in srgb, var(--brand-primary) 4%, white)"
                        : "color-mix(in srgb, var(--brand-primary) 7%, white)",
                  }}
                >
                  {row.linkrunner}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Compared to
        </span>
        {enabled.map((key) => (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm"
          >
            <CheckCircle2 className="h-3 w-3 text-gray-400" />
            {COMPETITOR_LABELS[key]}
          </span>
        ))}
      </div>
    </div>
  );
}
