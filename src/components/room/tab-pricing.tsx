"use client";

import { useMemo, useState } from "react";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type {
  Pricing,
  PricingData,
  RangeTier,
  CompetitorPricing,
} from "@/lib/types";
import { normalizePricingData } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Defaults — shown when admin hasn't configured anything             */
/*  Based on linkrunner.io/pricing INR tiers.                          */
/* ------------------------------------------------------------------ */

const DEFAULT_RANGES: RangeTier[] = [
  { min_volume: 0, max_volume: 100_000, per_install_price: 0.9 },
  { min_volume: 100_000, max_volume: 500_000, per_install_price: 0.8 },
  { min_volume: 500_000, max_volume: 1_000_000, per_install_price: 0.7 },
];

const DEFAULT_COMPETITORS: CompetitorPricing[] = [
  {
    name: "AppsFlyer",
    per_install_price: 5.0,
    pricing_model: "Per conversion",
    notes: "Requires annual contract",
  },
  {
    name: "Adjust",
    per_install_price: 4.5,
    pricing_model: "Per attribution",
    notes: "Annual commitment required",
  },
  {
    name: "Branch",
    per_install_price: 4.0,
    pricing_model: "Per MAU",
    notes: "Enterprise plan only for full features",
  },
];

const DEFAULT_VALUE_PROPS = [
  "All features included",
  "Postpaid monthly",
  "No annual lock-in",
  "Dedicated support",
];

/** Candidate slider stops; filtered to the configured tier bounds. */
const NICE_STEPS = [
  5_000, 10_000, 25_000, 50_000, 75_000, 100_000, 150_000, 200_000, 250_000,
  300_000, 400_000, 500_000, 600_000, 750_000, 1_000_000, 1_500_000,
  2_000_000, 3_000_000, 5_000_000,
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Resolve configured ranges: range_tiers, else legacy volume_tiers, else defaults. */
function resolveRanges(data: PricingData): RangeTier[] {
  if (data.range_tiers && data.range_tiers.length > 0) {
    return [...data.range_tiers].sort((a, b) => a.min_volume - b.min_volume);
  }
  if (data.volume_tiers && data.volume_tiers.length > 0) {
    const points = [...data.volume_tiers].sort((a, b) => a.volume - b.volume);
    return points.map((p, i) => ({
      min_volume: i === 0 ? 0 : points[i - 1].volume,
      max_volume: p.volume,
      per_install_price: p.per_install_price,
    }));
  }
  return DEFAULT_RANGES;
}

/** Slider stops: nice values within bounds, tier boundaries always included. */
function buildSteps(ranges: RangeTier[]): number[] {
  const maxBound = ranges[ranges.length - 1].max_volume;
  const set = new Set<number>(NICE_STEPS.filter((v) => v <= maxBound));
  for (const r of ranges) {
    if (r.min_volume > 0) set.add(r.min_volume);
    set.add(r.max_volume);
  }
  return [...set].sort((a, b) => a - b);
}

function tierFor(ranges: RangeTier[], volume: number): RangeTier {
  return (
    ranges.find((r) => volume > r.min_volume && volume <= r.max_volume) ??
    ranges[ranges.length - 1]
  );
}

/** Compact volume label: 50K, 1M. */
function fmtVol(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toLocaleString("en", { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function fmtPrice(n: number, currency: string): string {
  if (n >= 1)
    return `${currency}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  return `${currency}${n.toFixed(2)}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface TabPricingProps {
  pricing: Pricing;
  companyName: string;
}

/**
 * Pricing tab — interactive estimator.
 * Drag the install-volume slider; the per-install rate comes from the
 * configured range tiers and the monthly estimate + competitor
 * comparison update live.
 */
export function TabPricing({ pricing, companyName }: TabPricingProps) {
  const data = normalizePricingData(pricing.pricing_data);

  const hasStructured =
    !!data.quote ||
    (data.range_tiers?.length ?? 0) > 0 ||
    (data.volume_tiers?.length ?? 0) > 0 ||
    (data.competitor_pricing?.length ?? 0) > 0;

  // Markdown-only mode (admin chose markdown and typed content)
  if (!hasStructured && pricing.content) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Pricing</h2>
        <div className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <MarkdownRenderer content={pricing.content} />
        </div>
      </div>
    );
  }

  return (
    <PricingEstimator
      data={data}
      companyName={companyName}
      notes={pricing.content}
    />
  );
}

function PricingEstimator({
  data,
  companyName,
  notes,
}: {
  data: PricingData;
  companyName: string;
  notes: string;
}) {
  const ranges = useMemo(() => resolveRanges(data), [data]);
  const steps = useMemo(() => buildSteps(ranges), [ranges]);

  const currency = data.quote?.currency ?? "₹";
  const freeThreshold = data.quote?.free_threshold ?? 25_000;
  const valueProps =
    data.quote?.value_props && data.quote.value_props.length > 0
      ? data.quote.value_props
      : DEFAULT_VALUE_PROPS;
  const competitors =
    data.competitor_pricing && data.competitor_pricing.length > 0
      ? data.competitor_pricing
      : DEFAULT_COMPETITORS;

  // Start at the admin's estimated volume (snapped), else ~100K.
  const initialIndex = useMemo(() => {
    const target = data.quote?.estimated_volume || 100_000;
    let best = 0;
    steps.forEach((s, i) => {
      if (Math.abs(s - target) < Math.abs(steps[best] - target)) best = i;
    });
    return best;
  }, [steps, data.quote?.estimated_volume]);

  const [stepIndex, setStepIndex] = useState(initialIndex);
  const volume = steps[Math.min(stepIndex, steps.length - 1)];
  const tier = tierFor(ranges, volume);
  const monthly = volume * tier.per_install_price;

  // Thin the labels if there are too many stops to fit.
  const labelEvery = steps.length > 10 ? 2 : 1;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Pricing for {companyName}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Pay per attributed install. Organic installs are free.
        </p>
      </div>

      {/* ── Interactive estimator ── */}
      <div className="rounded-2xl bg-white px-6 py-8 shadow-sm sm:px-10">
        <p className="text-center text-sm font-medium text-gray-500">
          How many installs per month?
        </p>

        {/* Step labels */}
        <div className="mt-5 flex justify-between">
          {steps.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setStepIndex(i)}
              className={cn(
                "min-w-0 flex-1 text-center text-[11px] font-medium tabular-nums transition-colors sm:text-xs",
                i === stepIndex
                  ? "font-bold text-[var(--brand-primary)]"
                  : "text-gray-400 hover:text-gray-600",
                i % labelEvery !== 0 &&
                  i !== stepIndex &&
                  "invisible sm:visible",
              )}
            >
              {fmtVol(s)}
            </button>
          ))}
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          step={1}
          value={stepIndex}
          onChange={(e) => setStepIndex(parseInt(e.target.value))}
          aria-label="Monthly installs"
          className="mt-2 h-2 w-full cursor-pointer"
          style={{ accentColor: "var(--brand-primary)" }}
        />

        {/* Live readout */}
        <div className="mt-8 text-center">
          <p className="text-5xl font-extrabold tracking-tight text-gray-900">
            {currency}
            {fmtNum(monthly)}
            <span className="text-lg font-medium text-gray-400">/mo</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {fmtNum(volume)} installs &times;{" "}
            <span className="font-semibold text-[var(--brand-primary)]">
              {fmtPrice(tier.per_install_price, currency)}
            </span>{" "}
            per install
            {freeThreshold > 0 && (
              <> &middot; first {fmtVol(freeThreshold)} free</>
            )}
          </p>
        </div>

        {/* Tier ranges */}
        <div className="mt-8 grid gap-2 sm:grid-cols-3">
          {ranges.map((r) => {
            const active = r === tier;
            return (
              <div
                key={r.min_volume}
                className={cn(
                  "rounded-xl px-4 py-3 text-center transition-colors",
                  active
                    ? "bg-[var(--brand-primary)] text-white"
                    : "bg-gray-100 text-gray-500",
                )}
              >
                <p
                  className={cn(
                    "text-xs font-medium",
                    active ? "text-white/75" : "text-gray-400",
                  )}
                >
                  {fmtVol(r.min_volume)} &ndash; {fmtVol(r.max_volume)}{" "}
                  installs
                </p>
                <p className="mt-0.5 text-lg font-bold">
                  {fmtPrice(r.per_install_price, currency)}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      active ? "text-white/75" : "text-gray-400",
                    )}
                  >
                    /install
                  </span>
                </p>
              </div>
            );
          })}
        </div>

        {/* Value props */}
        <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {valueProps.map((prop) => (
            <span
              key={prop}
              className="flex items-center gap-1.5 text-sm text-gray-600"
            >
              <Check className="h-4 w-4 text-[var(--brand-primary)]" />
              {prop}
            </span>
          ))}
        </div>
      </div>

      {/* ── Competitor comparison (live at slider volume) ── */}
      {competitors.length > 0 && (
        <CompetitorSection
          competitors={competitors}
          volume={volume}
          perInstall={tier.per_install_price}
          currency={currency}
        />
      )}

      {/* Optional markdown notes */}
      {notes && (
        <div className="mx-auto mt-10 max-w-3xl rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <MarkdownRenderer content={notes} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Competitor comparison                                              */
/* ------------------------------------------------------------------ */

function CompetitorSection({
  competitors,
  volume,
  perInstall,
  currency,
}: {
  competitors: CompetitorPricing[];
  volume: number;
  perInstall: number;
  currency: string;
}) {
  const linkrunnerMonthly = volume * perInstall;

  return (
    <div className="mt-12">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-900">
          Same volume, elsewhere
        </h3>
      </div>

      <div
        className={cn(
          "grid gap-4",
          competitors.length === 1 &&
            "mx-auto max-w-3xl grid-cols-1 sm:grid-cols-2",
          competitors.length === 2 &&
            "mx-auto max-w-4xl grid-cols-1 sm:grid-cols-3",
          competitors.length >= 3 &&
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        {/* Linkrunner — always first */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-md">
          <div className="bg-[var(--brand-primary)] px-5 py-2">
            <span className="text-xs font-bold text-white">Linkrunner</span>
          </div>
          <div className="px-5 py-5">
            <p className="text-3xl font-extrabold tracking-tight text-gray-900">
              {currency}
              {fmtNum(linkrunnerMonthly)}
              <span className="text-sm font-medium text-gray-400">/mo</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {fmtPrice(perInstall, currency)} per install
            </p>
          </div>
        </div>

        {competitors.map((comp) => {
          const compMonthly = volume * comp.per_install_price;
          const savingsPct =
            compMonthly > 0
              ? Math.round(
                  ((compMonthly - linkrunnerMonthly) / compMonthly) * 100,
                )
              : 0;
          return (
            <div
              key={comp.name}
              className="relative overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <div className="bg-gray-100 px-5 py-2">
                <span className="text-xs font-bold text-gray-500">
                  {comp.name}
                </span>
              </div>
              <div className="px-5 py-5">
                <p className="text-3xl font-extrabold tracking-tight text-gray-300">
                  {currency}
                  {fmtNum(compMonthly)}
                  <span className="text-sm font-medium text-gray-300">
                    /mo
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {fmtPrice(comp.per_install_price, currency)}{" "}
                  {comp.pricing_model.toLowerCase()}
                </p>
                {savingsPct > 0 && (
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {savingsPct}% cheaper with us
                  </p>
                )}
                {comp.notes && (
                  <p className="mt-1 text-xs italic text-gray-400">
                    {comp.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
