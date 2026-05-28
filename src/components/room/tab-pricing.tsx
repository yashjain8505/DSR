import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { Pricing } from "@/lib/types";

interface TabPricingProps {
  pricing: Pricing;
}

/**
 * Pricing tab. Shows structured pricing cards when pricing_data exists,
 * otherwise falls back to markdown content.
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
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Pricing</h2>
        <p className="mt-2 text-sm text-gray-500">
          Choose the plan that fits your needs
        </p>
      </div>

      <div
        className={cn(
          "grid gap-6",
          tiers.length === 1 && "max-w-md mx-auto",
          tiers.length === 2 && "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto",
          tiers.length >= 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {tiers.map((tier, i) => (
          <Card
            key={i}
            variant={tier.is_highlighted ? "elevated" : "default"}
            className={cn(
              "relative flex flex-col",
              tier.is_highlighted &&
                "ring-2 ring-[var(--brand-primary)] shadow-lg scale-[1.02]"
            )}
          >
            {tier.is_highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="info" className="px-3 py-1 text-xs font-semibold">
                  Recommended
                </Badge>
              </div>
            )}

            <CardContent className="flex flex-1 flex-col p-6">
              {/* Tier header */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {tier.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {tier.price}
                  </span>
                  {tier.billing_period && (
                    <span className="text-sm text-gray-500">
                      /{tier.billing_period}
                    </span>
                  )}
                </div>
                {tier.description && (
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {tier.description}
                  </p>
                )}
              </div>

              {/* Features list */}
              {tier.features.length > 0 && (
                <ul className="mb-8 flex-1 space-y-3">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* CTA */}
              {tier.cta_url && (
                <a
                  href={tier.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "mt-auto block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors",
                    tier.is_highlighted
                      ? "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)]"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  )}
                >
                  {tier.cta_label || "Get Started"}
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Optional fallback markdown below cards */}
      {pricing.content && (
        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <MarkdownRenderer content={pricing.content} />
        </div>
      )}
    </div>
  );
}
