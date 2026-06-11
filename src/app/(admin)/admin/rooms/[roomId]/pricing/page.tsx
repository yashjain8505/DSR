"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import type {
  Pricing,
  PricingQuote,
  PricingData,
  RangeTier,
  CompetitorPricing,
} from "@/lib/types";
import { normalizePricingData } from "@/lib/types";

const defaultQuote: PricingQuote = {
  estimated_volume: 0,
  per_install_price: 0.7,
  currency: "₹",
  free_threshold: 25000,
  value_props: [
    "All core features included",
    "Postpaid monthly billing",
    "No annual lock-in",
    "Dedicated support",
  ],
};

export default function PricingEditorPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const [content, setContent] = useState("");
  const [quote, setQuote] = useState<PricingQuote>({ ...defaultQuote });
  const [showQuote, setShowQuote] = useState(false);
  const [rangeTiers, setRangeTiers] = useState<RangeTier[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorPricing[]>([]);
  const [mode, setMode] = useState<"markdown" | "structured">("markdown");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch(`/api/rooms/${roomId}/pricing`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        const pricing: Pricing = json.pricing;
        setContent(pricing.content);

        const normalized = normalizePricingData(pricing.pricing_data);

        if (normalized.quote) {
          setQuote(normalized.quote);
          setShowQuote(true);
        }
        if (normalized.range_tiers?.length) {
          setRangeTiers(normalized.range_tiers);
        } else if (normalized.volume_tiers?.length) {
          // Legacy point tiers -> ranges, so old rooms edit seamlessly
          const points = [...normalized.volume_tiers].sort(
            (a, b) => a.volume - b.volume,
          );
          setRangeTiers(
            points.map((pt, i) => ({
              min_volume: i === 0 ? 0 : points[i - 1].volume,
              max_volume: pt.volume,
              per_install_price: pt.per_install_price,
            })),
          );
        }
        if (normalized.competitor_pricing) {
          setCompetitors(normalized.competitor_pricing);
        }

        setMode(
          normalized.range_tiers?.length ||
            normalized.volume_tiers?.length ||
            normalized.quote ||
            normalized.competitor_pricing?.length
            ? "structured"
            : "markdown",
        );
      } catch {
        setError("Failed to load pricing");
      } finally {
        setLoading(false);
      }
    }
    fetchPricing();
  }, [roomId]);

  /* ---- quote helpers ---- */

  function updateQuote<K extends keyof PricingQuote>(
    field: K,
    value: PricingQuote[K],
  ) {
    setQuote((prev) => ({ ...prev, [field]: value }));
  }

  /* ---- range tier helpers ---- */

  function addRangeTier() {
    setRangeTiers((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        last
          ? {
              min_volume: last.max_volume,
              max_volume: last.max_volume * 5,
              per_install_price: Math.max(
                0.1,
                Math.round((last.per_install_price - 0.1) * 100) / 100,
              ),
            }
          : { min_volume: 0, max_volume: 100000, per_install_price: 0.9 },
      ];
    });
  }

  function removeRangeTier(index: number) {
    setRangeTiers((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRangeTier(
    index: number,
    field: keyof RangeTier,
    value: number,
  ) {
    setRangeTiers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    );
  }

  /* ---- competitor helpers ---- */

  function addCompetitor() {
    setCompetitors((prev) => [
      ...prev,
      { name: "", per_install_price: 0, pricing_model: "Per install" },
    ]);
  }

  function removeCompetitor(index: number) {
    setCompetitors((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCompetitor(
    index: number,
    field: keyof CompetitorPricing,
    value: string | number,
  ) {
    setCompetitors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  }

  /* ---- save ---- */

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const pricingData: PricingData = {};

      if (showQuote && quote.estimated_volume > 0) {
        pricingData.quote = quote;
      }
      const validRanges = rangeTiers.filter(
        (t) => t.max_volume > t.min_volume && t.per_install_price > 0,
      );
      if (validRanges.length > 0) {
        pricingData.range_tiers = [...validRanges].sort(
          (a, b) => a.min_volume - b.min_volume,
        );
      }
      if (competitors.length > 0) {
        pricingData.competitor_pricing = competitors.filter(
          (c) => c.name.trim() && c.per_install_price > 0,
        );
      }

      const hasData =
        pricingData.quote ||
        (pricingData.range_tiers?.length ?? 0) > 0 ||
        (pricingData.competitor_pricing?.length ?? 0) > 0;

      const payload: { content: string; pricing_data: PricingData | never[] } =
        {
          content,
          pricing_data: mode === "structured" && hasData ? pricingData : [],
        };

      const res = await fetch(`/api/rooms/${roomId}/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setSuccess("Pricing saved");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  /* ---- computed preview ---- */

  const monthlyCost = quote.estimated_volume * quote.per_install_price;
  const fmtCost =
    quote.currency +
    monthlyCost.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  /* ---- render ---- */

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>
        <Button onClick={handleSave} loading={saving}>
          Save
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

      {/* Mode toggle */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={mode === "markdown" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setMode("markdown")}
        >
          Markdown
        </Button>
        <Button
          variant={mode === "structured" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setMode("structured")}
        >
          Structured
        </Button>
      </div>

      {mode === "markdown" ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <Textarea
            label="Pricing Content (Markdown)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            placeholder="Describe your pricing here..."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ═══════════════ CUSTOMER QUOTE ═══════════════ */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Customer Quote
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Estimated Volume sets where the room&apos;s pricing slider
                  starts; currency, free threshold &amp; value props show on
                  the pricing tab
                </p>
              </div>
              <Toggle
                checked={showQuote}
                onChange={setShowQuote}
                label="Show quote"
              />
            </div>

            {showQuote && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Input
                    label="Estimated Volume"
                    type="number"
                    value={quote.estimated_volume || ""}
                    onChange={(e) =>
                      updateQuote(
                        "estimated_volume",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    placeholder="150000"
                  />
                  <Input
                    label="Per-Install Price"
                    type="number"
                    step="0.01"
                    value={quote.per_install_price || ""}
                    onChange={(e) =>
                      updateQuote(
                        "per_install_price",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="0.70"
                  />
                  <Input
                    label="Currency"
                    value={quote.currency}
                    onChange={(e) => updateQuote("currency", e.target.value)}
                    placeholder="₹"
                  />
                  <Input
                    label="Free Threshold"
                    type="number"
                    value={quote.free_threshold || ""}
                    onChange={(e) =>
                      updateQuote(
                        "free_threshold",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    placeholder="25000"
                  />
                </div>

                {/* Live preview */}
                {quote.estimated_volume > 0 && (
                  <div className="rounded-lg border border-indigo-100 bg-white p-4">
                    <p className="text-xs font-medium text-gray-400">
                      Preview
                    </p>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {fmtCost}
                      <span className="text-sm font-normal text-gray-400">
                        /mo
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {quote.estimated_volume.toLocaleString("en-IN")} x{" "}
                      {quote.currency}
                      {quote.per_install_price}
                      {quote.free_threshold > 0 && (
                        <span>
                          {" "}
                          (first{" "}
                          {quote.free_threshold.toLocaleString("en-IN")} free,
                          one-time)
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <Input
                  label="Value Propositions (comma-separated)"
                  value={quote.value_props.join(", ")}
                  onChange={(e) =>
                    updateQuote(
                      "value_props",
                      e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="All core features included, Postpaid monthly billing, No annual lock-in"
                />
              </div>
            )}
          </div>

          {/* ═══════════════ PRICING RANGES (SLIDER) ═══════════════ */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-1">
              <h2 className="text-base font-semibold text-gray-900">
                Pricing Ranges
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Volume brackets for the interactive slider on the room pricing
                tab — e.g. 0&ndash;100K at ₹0.90, 100K&ndash;500K at ₹0.80.
                The prospect drags the slider and the price updates live.
              </p>
            </div>

            {rangeTiers.length > 0 && (
              <div className="mt-4 space-y-3">
                {/* Header row */}
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-1">
                  <p className="text-xs font-medium text-gray-400">
                    From (installs/mo)
                  </p>
                  <p className="text-xs font-medium text-gray-400">
                    To (installs/mo)
                  </p>
                  <p className="text-xs font-medium text-gray-400">
                    Per-Install Price ({quote.currency})
                  </p>
                  <div className="w-8" />
                </div>

                {rangeTiers.map((rt, index) => {
                  const invalid =
                    rt.max_volume > 0 && rt.max_volume <= rt.min_volume;
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 p-3"
                    >
                      <Input
                        type="number"
                        value={rt.min_volume || ""}
                        onChange={(e) =>
                          updateRangeTier(
                            index,
                            "min_volume",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        placeholder="0"
                      />
                      <Input
                        type="number"
                        value={rt.max_volume || ""}
                        onChange={(e) =>
                          updateRangeTier(
                            index,
                            "max_volume",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        placeholder="100000"
                        error={invalid ? "Must be greater than From" : undefined}
                      />
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={rt.per_install_price || ""}
                          onChange={(e) =>
                            updateRangeTier(
                              index,
                              "per_install_price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="0.90"
                        />
                        {rt.max_volume > rt.min_volume &&
                          rt.per_install_price > 0 && (
                            <p className="shrink-0 text-xs text-gray-400">
                              at {rt.max_volume.toLocaleString("en-IN")}:{" "}
                              {quote.currency}
                              {(
                                rt.max_volume * rt.per_install_price
                              ).toLocaleString("en-IN", {
                                maximumFractionDigits: 0,
                              })}
                              /mo
                            </p>
                          )}
                      </div>
                      <button
                        type="button"
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500"
                        onClick={() => removeRangeTier(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={addRangeTier}>
                <Plus className="h-4 w-4" />
                Add Range
              </Button>
            </div>
          </div>

          {/* ═══════════════ COMPETITOR COMPARISON ═══════════════ */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-6">
            <div className="mb-1">
              <h2 className="text-base font-semibold text-gray-900">
                Competitor Comparison
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Show how much competitors charge vs Linkrunner (uses the
                customer&apos;s estimated volume for the comparison)
              </p>
            </div>

            {competitors.length > 0 && (
              <div className="mt-4 space-y-3">
                {competitors.map((comp, index) => {
                  const compMonthly =
                    quote.estimated_volume * comp.per_install_price;
                  return (
                    <div
                      key={index}
                      className="space-y-2 rounded-lg border border-amber-100 bg-white p-3"
                    >
                      <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-4">
                        <Input
                          label="Competitor Name"
                          value={comp.name}
                          onChange={(e) =>
                            updateCompetitor(index, "name", e.target.value)
                          }
                          placeholder="AppsFlyer"
                        />
                        <Input
                          label={`Per-Install Price (${quote.currency})`}
                          type="number"
                          step="0.01"
                          value={comp.per_install_price || ""}
                          onChange={(e) =>
                            updateCompetitor(
                              index,
                              "per_install_price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="5.00"
                        />
                        <Input
                          label="Pricing Model"
                          value={comp.pricing_model}
                          onChange={(e) =>
                            updateCompetitor(
                              index,
                              "pricing_model",
                              e.target.value,
                            )
                          }
                          placeholder="Per conversion"
                        />
                        <button
                          type="button"
                          className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500"
                          onClick={() => removeCompetitor(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Inline preview */}
                      {comp.name &&
                        comp.per_install_price > 0 &&
                        quote.estimated_volume > 0 && (
                          <div className="flex items-center gap-3 px-1">
                            <p className="text-xs text-gray-400">
                              {comp.name}:{" "}
                              <span className="font-medium text-gray-600">
                                {quote.currency}
                                {compMonthly.toLocaleString("en-IN", {
                                  maximumFractionDigits: 0,
                                })}
                                /mo
                              </span>
                            </p>
                            {compMonthly > monthlyCost && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                {Math.round(
                                  ((compMonthly - monthlyCost) / compMonthly) *
                                    100,
                                )}
                                % cheaper with Linkrunner
                              </span>
                            )}
                          </div>
                        )}

                      {/* Notes */}
                      <Input
                        label="Note (optional)"
                        value={comp.notes ?? ""}
                        onChange={(e) =>
                          updateCompetitor(index, "notes", e.target.value)
                        }
                        placeholder="e.g. Requires annual contract"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={addCompetitor}>
                <Plus className="h-4 w-4" />
                Add Competitor
              </Button>
            </div>
          </div>

          {/* ═══════════════ NOTES ═══════════════ */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <Textarea
              label="Additional Notes (Markdown, shown below pricing)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Optional notes below the pricing cards..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
