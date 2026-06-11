import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { cn } from "@/lib/utils";
import { Check, Sparkles, TrendingDown, ArrowRight } from "lucide-react";
import type {
  Pricing,
  PricingQuote,
  PricingData,
  VolumeTier,
  CompetitorPricing,
} from "@/lib/types";
import { normalizePricingData } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Default pricing — shown when admin hasn't configured anything      */
/*  Based on linkrunner.io/pricing INR tiers.                          */
/* ------------------------------------------------------------------ */

const DEFAULT_PRICING: PricingData = {
  quote: {
    estimated_volume: 100000,
    per_install_price: 0.9,
    currency: "₹",
    free_threshold: 25000,
    value_props: [
      "All core features included",
      "Postpaid monthly billing",
      "No annual lock-in",
      "Dedicated support",
    ],
  },
  volume_tiers: [
    { volume: 50000, per_install_price: 1.0 },
    { volume: 100000, per_install_price: 0.9 },
    { volume: 300000, per_install_price: 0.8 },
    { volume: 500000, per_install_price: 0.7 },
  ],
  competitor_pricing: [
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
  ],
};

interface TabPricingProps {
  pricing: Pricing;
  companyName: string;
}

/**
 * Pricing tab — prospect-facing.
 *
 * Layout:
 * 1. "Pricing for {company}" heading
 * 2. Side-by-side: Quote card (left) + Volume tiers stacked (right)
 * 3. Competitor pricing comparison section
 * 4. Optional markdown notes at the bottom
 *
 * Falls back to default Linkrunner pricing when nothing is configured.
 */
export function TabPricing({ pricing, companyName }: TabPricingProps) {
  const raw = normalizePricingData(pricing.pricing_data);

  const hasCustomData =
    !!raw.quote ||
    (raw.volume_tiers && raw.volume_tiers.length > 0) ||
    (raw.competitor_pricing && raw.competitor_pricing.length > 0);

  // Use custom data if configured, otherwise fall back to defaults
  const data = hasCustomData ? raw : DEFAULT_PRICING;
  const { quote, volume_tiers, competitor_pricing } = data;

  // Markdown-only mode (admin chose markdown and typed content)
  if (!hasCustomData && pricing.content) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Pricing</h2>
        </div>
        <div className="rounded-xl bg-white p-6 sm:p-8">
          <MarkdownRenderer content={pricing.content} />
        </div>
      </div>
    );
  }

  const currency = quote?.currency ?? "₹";
  const hasQuote = quote && quote.estimated_volume > 0;
  const hasTiers = volume_tiers && volume_tiers.length > 0;
  const hasCompetitors =
    competitor_pricing && competitor_pricing.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Pricing for {companyName}
        </h2>
      </div>

      {/* ═══════════════ MAIN PRICING SECTION ═══════════════ */}
      {/* Side-by-side: Quote card (left) + Volume tiers (right) */}
      {hasQuote && hasTiers ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_auto]">
          <QuoteCard quote={quote} />
          <div className="flex flex-col gap-3 lg:w-72">
            <div className="mb-1 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">
                Volume pricing
              </h3>
            </div>
            {volume_tiers.map((vt, i) => (
              <VolumeTierCard
                key={i}
                tier={vt}
                currency={currency}
                isLowest={
                  vt.per_install_price ===
                  Math.min(...volume_tiers.map((t) => t.per_install_price))
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Only quote, no tiers */}
          {hasQuote && <QuoteCard quote={quote} />}

          {/* Only tiers, no quote */}
          {hasTiers && !hasQuote && (
            <div>
              <div className="mb-5 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Volume pricing
                </h3>
              </div>
              <div
                className={cn(
                  "grid gap-4",
                  volume_tiers.length === 1 &&
                    "max-w-sm grid-cols-1",
                  volume_tiers.length === 2 &&
                    "max-w-2xl grid-cols-1 sm:grid-cols-2",
                  volume_tiers.length >= 3 &&
                    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                )}
              >
                {volume_tiers.map((vt, i) => (
                  <VolumeTierCard
                    key={i}
                    tier={vt}
                    currency={currency}
                    isLowest={
                      vt.per_install_price ===
                      Math.min(
                        ...volume_tiers.map((t) => t.per_install_price),
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════ COMPETITOR COMPARISON ═══════════════ */}
      {hasCompetitors && hasQuote && (
        <CompetitorSection
          competitors={competitor_pricing}
          quote={quote}
        />
      )}

      {/* Optional markdown notes */}
      {pricing.content && (
        <div className="mx-auto mt-12 max-w-3xl rounded-xl bg-white p-6 sm:p-8">
          <MarkdownRenderer content={pricing.content} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Personalized Quote Card                                           */
/* ------------------------------------------------------------------ */

function QuoteCard({ quote }: { quote: PricingQuote }) {
  const {
    estimated_volume,
    per_install_price,
    currency,
    free_threshold,
    value_props,
  } = quote;

  // Free installs are a one-time credit, not monthly. Monthly cost is the
  // full volume multiplied by the per-install price.
  const monthlyCost = estimated_volume * per_install_price;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
      {/* Header bar */}
      <div className="flex items-center gap-2 bg-gray-900 px-6 py-3">
        <Sparkles className="h-4 w-4 text-white/80" />
        <span className="text-sm font-semibold tracking-wide text-white">
          Your Quote
        </span>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-8">
        {/* Key metrics */}
        <dl className="space-y-4">
          <QuoteRow
            label="Estimated volume"
            value={`${fmtNum(estimated_volume)} installs/mo`}
          />
          <QuoteRow
            label="Per-install price"
            value={fmtPrice(per_install_price, currency)}
          />
          {free_threshold > 0 && (
            <QuoteRow
              label="Free to start"
              value={`First ${fmtNum(free_threshold)} installs free`}
              muted
            />
          )}
        </dl>

        {/* Divider + total */}
        <div className="my-5 h-px bg-gray-100" />

        <div className="flex items-baseline justify-between">
          <dt className="text-sm font-medium text-gray-500">
            Estimated monthly
          </dt>
          <dd className="text-3xl font-extrabold tracking-tight text-gray-900">
            {currency}
            {fmtNum(monthlyCost)}
            <span className="text-base font-medium text-gray-400">/mo</span>
          </dd>
        </div>
        <p className="mt-1 text-right text-xs text-gray-400">
          {fmtNum(estimated_volume)} x {fmtPrice(per_install_price, currency)}
        </p>

        {/* Value propositions */}
        {value_props.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {value_props.map((prop, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <span className="text-sm text-gray-600">{prop}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuoteRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd
        className={cn(
          "text-lg font-semibold",
          muted ? "text-gray-400" : "text-gray-900",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Volume Tier Card (compact for stacked view)                       */
/* ------------------------------------------------------------------ */

function VolumeTierCard({
  tier,
  currency,
  isLowest,
}: {
  tier: VolumeTier;
  currency: string;
  isLowest: boolean;
}) {
  const monthly = tier.volume * tier.per_install_price;

  return (
    <div
      className={cn(
        "relative rounded-2xl bg-white px-5 py-5 transition-shadow",
        isLowest ? "shadow-md" : "shadow-sm",
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500">
            {fmtNum(tier.volume)} installs/mo
          </p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
            {fmtPrice(tier.per_install_price, currency)}
            <span className="text-sm font-medium text-gray-400">
              /install
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-gray-400">Monthly</p>
          <p className="text-base font-bold text-gray-900">
            {currency}
            {fmtNum(monthly)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Competitor Comparison Section                                     */
/* ------------------------------------------------------------------ */

function CompetitorSection({
  competitors,
  quote,
}: {
  competitors: CompetitorPricing[];
  quote: PricingQuote;
}) {
  const { estimated_volume, per_install_price, currency } = quote;
  const linkrunnerMonthly = estimated_volume * per_install_price;

  return (
    <div className="mt-14">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-900">
          How we compare
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Estimated monthly cost at {fmtNum(estimated_volume)} installs/mo
        </p>
      </div>

      <div
        className={cn(
          "grid gap-4",
          competitors.length === 1 && "max-w-3xl mx-auto grid-cols-1 sm:grid-cols-2",
          competitors.length === 2 && "max-w-4xl mx-auto grid-cols-1 sm:grid-cols-3",
          competitors.length >= 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        {/* Linkrunner card — always first, highlighted */}
        <LinkrunnerCompareCard
          monthlyCost={linkrunnerMonthly}
          perInstall={per_install_price}
          currency={currency}
          volume={estimated_volume}
        />

        {/* Competitor cards */}
        {competitors.map((comp, i) => {
          const compMonthly = estimated_volume * comp.per_install_price;
          const savings = compMonthly - linkrunnerMonthly;
          const savingsPct =
            compMonthly > 0
              ? Math.round((savings / compMonthly) * 100)
              : 0;

          return (
            <CompetitorCard
              key={i}
              competitor={comp}
              monthlyCost={compMonthly}
              currency={currency}
              volume={estimated_volume}
              savings={savings}
              savingsPct={savingsPct}
            />
          );
        })}
      </div>
    </div>
  );
}

function LinkrunnerCompareCard({
  monthlyCost,
  perInstall,
  currency,
  volume,
}: {
  monthlyCost: number;
  perInstall: number;
  currency: string;
  volume: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-md">
      {/* Accent bar */}
      <div className="bg-gray-900 px-5 py-2">
        <span className="text-xs font-bold uppercase tracking-wider text-white">
          Linkrunner
        </span>
      </div>
      <div className="px-5 py-5">
        <p className="text-xs font-medium text-gray-400">
          Monthly cost
        </p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900">
          {currency}
          {fmtNum(monthlyCost)}
        </p>

        <div className="mt-4 space-y-2 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>Per install</span>
            <span className="font-medium text-gray-900">
              {fmtPrice(perInstall, currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Volume</span>
            <span className="font-medium text-gray-900">
              {fmtNum(volume)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompetitorCard({
  competitor,
  monthlyCost,
  currency,
  volume,
  savings,
  savingsPct,
}: {
  competitor: CompetitorPricing;
  monthlyCost: number;
  currency: string;
  volume: number;
  savings: number;
  savingsPct: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Header */}
      <div className="bg-gray-100 px-5 py-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          {competitor.name}
        </span>
      </div>
      <div className="px-5 py-5">
        <p className="text-xs font-medium text-gray-400">
          Monthly cost
        </p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-gray-400">
          {currency}
          {fmtNum(monthlyCost)}
        </p>

        <div className="mt-4 space-y-2 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>{competitor.pricing_model}</span>
            <span className="font-medium">
              {fmtPrice(competitor.per_install_price, currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Volume</span>
            <span className="font-medium">{fmtNum(volume)}</span>
          </div>
        </div>

        {/* Savings callout */}
        {savings > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
            <ArrowRight className="h-3.5 w-3.5 text-gray-600" />
            <span className="text-xs font-semibold text-gray-900">
              Save {currency}
              {fmtNum(savings)}/mo ({savingsPct}%) with Linkrunner
            </span>
          </div>
        )}

        {competitor.notes && (
          <p className="mt-3 text-xs text-gray-400 italic">
            {competitor.notes}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                */
/* ------------------------------------------------------------------ */

function fmtNum(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function fmtPrice(n: number, currency: string): string {
  if (n >= 1)
    return `${currency}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  return `${currency}${n.toFixed(2)}`;
}
