import type { RangeTier, CompetitorPricing } from "@/lib/types";

/**
 * Default structured-pricing values, shared by the prospect pricing tab (shown
 * when an admin hasn't configured anything) and the admin pricing editor (so the
 * structured form is pre-filled and the admin only tweaks numbers per customer).
 * Based on linkrunner.io/pricing INR tiers.
 */

export const DEFAULT_RANGE_TIERS: RangeTier[] = [
  { min_volume: 0, max_volume: 50_000, per_install_price: 1 },
  { min_volume: 50_000, max_volume: 100_000, per_install_price: 0.9 },
  { min_volume: 100_000, max_volume: 500_000, per_install_price: 0.8 },
];

export const DEFAULT_COMPETITOR_PRICING: CompetitorPricing[] = [
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
