import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { Pricing, PricingTier } from "@/lib/types";

interface TabPricingProps {
  pricing: Pricing;
}

/**
 * Pricing tab — prospect-facing.
 *
 * When `pricing_data` contains structured tiers it renders a card grid
 * inspired by linkrunner.io/pricing: light gradient backdrop, three
 * side-by-side cards, the highlighted tier in the center with a colored
 * border and "Recommended" badge. Each card shows plan name, price,
 * feature list, CTA(s), and an optional "Preferred for" section.
 *
 * Falls back to rendering `pricing.content` as markdown when no tiers
 * are defined.
 */
export function TabPricing({ pricing }: TabPricingProps) {
  if (!pricing.pricing_data || pricing.pricing_data.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Pricing</h2>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <MarkdownRenderer content={pricing.content} />
        </div>
      </div>
    );
  }

  const tiers = pricing.pricing_data;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Pricing
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-base text-gray-500">
          Choose the plan that fits your needs
        </p>
      </div>

      {/* Tier cards */}
      <div
        className={cn(
          "mx-auto grid items-start gap-6 lg:gap-8",
          tiers.length === 1 && "max-w-md grid-cols-1",
          tiers.length === 2 && "max-w-3xl grid-cols-1 sm:grid-cols-2",
          tiers.length >= 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {tiers.map((tier, i) => (
          <TierCard key={i} tier={tier} />
        ))}
      </div>

      {/* Optional markdown notes below cards */}
      {pricing.content && (
        <div className="mx-auto mt-12 max-w-3xl rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <MarkdownRenderer content={pricing.content} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TierCard({ tier }: { tier: PricingTier }) {
  const highlighted = tier.is_highlighted;
  const preferredFor = tier.preferred_for ?? [];

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl bg-white transition-shadow",
        highlighted
          ? "border-2 border-[var(--brand-primary)] shadow-lg ring-1 ring-[var(--brand-primary)]/20"
          : "border border-gray-200 shadow-sm",
      )}
    >
      {/* Recommended badge */}
      {highlighted && (
        <div className="px-6 pt-5 pb-0">
          <span className="text-sm font-semibold text-[var(--brand-primary)]">
            Recommended
          </span>
        </div>
      )}

      <div
        className={cn(
          "flex flex-1 flex-col px-6 pb-8",
          highlighted ? "pt-3" : "pt-6",
        )}
      >
        {/* Plan name + subtitle */}
        <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
        {tier.description && (
          <p className="mt-1 text-sm leading-5 text-gray-500">
            {tier.description}
          </p>
        )}

        {/* Price */}
        <div className="mt-5 flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tracking-tight text-gray-900">
            {tier.price}
          </span>
          {tier.billing_period && (
            <span className="text-base font-medium text-gray-500">
              /{tier.billing_period}
            </span>
          )}
        </div>

        {/* Feature list */}
        {tier.features.length > 0 && (
          <ul className="mt-7 flex-1 space-y-3">
            {tier.features.map((feature, j) => (
              <li key={j} className="flex items-start gap-3">
                <Check
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    highlighted
                      ? "text-[var(--brand-primary)]"
                      : "text-gray-400",
                  )}
                />
                <span className="text-sm leading-5 text-gray-700">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA buttons */}
        <div className="mt-8 space-y-3">
          {tier.cta_url && (
            <a
              href={tier.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors",
                highlighted
                  ? "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)]"
                  : "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
              )}
            >
              {tier.cta_label || "Get Started"}
            </a>
          )}
          {tier.secondary_cta_url && (
            <a
              href={tier.secondary_cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
            >
              {tier.secondary_cta_label || "Learn more"}
            </a>
          )}
        </div>

        {/* Preferred for */}
        {preferredFor.length > 0 && (
          <div className="mt-8 border-t border-gray-100 pt-6">
            <p className="mb-3 text-sm font-medium text-gray-400">
              Preferred for
            </p>
            <ul className="space-y-2.5">
              {preferredFor.map((item, j) => (
                <li key={j} className="flex items-start gap-3">
                  <Check
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      highlighted
                        ? "text-[var(--brand-primary)]"
                        : "text-gray-400",
                    )}
                  />
                  <span className="text-sm leading-5 text-gray-600">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
