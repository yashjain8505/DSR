"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import type { Pricing, PricingTier } from "@/lib/types";

const emptyTier: PricingTier = {
  name: "",
  price: "",
  billing_period: "",
  description: "",
  features: [],
  is_highlighted: false,
  cta_label: "Get Started",
  cta_url: "",
  preferred_for: [],
  secondary_cta_label: "",
  secondary_cta_url: "",
};

export default function PricingEditorPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const [content, setContent] = useState("");
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [mode, setMode] = useState<"markdown" | "structured">("markdown");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch(`/api/rooms/${roomId}/pricing`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const pricing: Pricing = data.pricing;
        setContent(pricing.content);
        setTiers(pricing.pricing_data ?? []);
        setMode(
          pricing.pricing_data && pricing.pricing_data.length > 0
            ? "structured"
            : "markdown"
        );
      } catch {
        setError("Failed to load pricing");
      } finally {
        setLoading(false);
      }
    }
    fetchPricing();
  }, [roomId]);

  function addTier() {
    setTiers((prev) => [...prev, { ...emptyTier }]);
  }

  function removeTier(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTier(index: number, field: keyof PricingTier, value: unknown) {
    setTiers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  }

  function moveTier(index: number, direction: "up" | "down") {
    setTiers((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggleCollapse(index: number) {
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload: { content: string; pricing_data?: PricingTier[] } = {
        content,
      };

      if (mode === "structured" && tiers.length > 0) {
        payload.pricing_data = tiers;
      } else {
        payload.pricing_data = [];
      }

      const res = await fetch(`/api/rooms/${roomId}/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Pricing saved");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

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
          Structured Tiers
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
        <div className="space-y-4">
          {/* Markdown fallback content */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <Textarea
              label="Additional Pricing Notes (Markdown, shown below tiers)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Optional notes below the pricing tiers..."
            />
          </div>

          {/* Pricing tiers */}
          {tiers.map((tier, index) => {
            const isCollapsed = collapsed[index];
            return (
              <div
                key={index}
                className={`rounded-xl border bg-white ${
                  tier.is_highlighted
                    ? "border-indigo-300 ring-1 ring-indigo-200"
                    : "border-gray-200"
                }`}
              >
                {/* Tier header — always visible */}
                <div className="flex items-center gap-3 px-6 py-4">
                  <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-2 text-left"
                    onClick={() => toggleCollapse(index)}
                  >
                    <h3 className="text-sm font-semibold text-gray-900">
                      Tier {index + 1}
                      {tier.name ? `: ${tier.name}` : ""}
                    </h3>
                    {tier.is_highlighted && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        Recommended
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                      onClick={() => moveTier(index, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                      onClick={() => moveTier(index, "down")}
                      disabled={index === tiers.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                      onClick={() => removeTier(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      onClick={() => toggleCollapse(index)}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Tier body — collapsible */}
                {!isCollapsed && (
                  <div className="border-t border-gray-100 px-6 pb-6 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Plan Name"
                        value={tier.name}
                        onChange={(e) =>
                          updateTier(index, "name", e.target.value)
                        }
                        placeholder="e.g. Growth"
                      />
                      <Input
                        label="Price"
                        value={tier.price}
                        onChange={(e) =>
                          updateTier(index, "price", e.target.value)
                        }
                        placeholder="e.g. $99 or Pay-as-you-go"
                      />
                      <Input
                        label="Billing Period"
                        value={tier.billing_period}
                        onChange={(e) =>
                          updateTier(index, "billing_period", e.target.value)
                        }
                        placeholder="e.g. month (leave empty for custom)"
                      />
                      <div className="flex items-end pb-1">
                        <Toggle
                          checked={tier.is_highlighted}
                          onChange={(val) =>
                            updateTier(index, "is_highlighted", val)
                          }
                          label="Recommended"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          label="Subtitle"
                          value={tier.description}
                          onChange={(e) =>
                            updateTier(index, "description", e.target.value)
                          }
                          placeholder="e.g. No credit card needed. No calendar expiry."
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          label="Features (comma-separated)"
                          value={tier.features.join(", ")}
                          onChange={(e) =>
                            updateTier(
                              index,
                              "features",
                              e.target.value
                                .split(",")
                                .map((f) => f.trim())
                                .filter(Boolean)
                            )
                          }
                          placeholder="25,000 attributed installs, All core features, ..."
                        />
                      </div>

                      {/* CTA fields */}
                      <Input
                        label="CTA Label"
                        value={tier.cta_label}
                        onChange={(e) =>
                          updateTier(index, "cta_label", e.target.value)
                        }
                        placeholder="e.g. Start the Growth plan"
                      />
                      <Input
                        label="CTA URL"
                        value={tier.cta_url}
                        onChange={(e) =>
                          updateTier(index, "cta_url", e.target.value)
                        }
                        placeholder="https://..."
                      />

                      {/* Secondary CTA */}
                      <Input
                        label="Secondary CTA Label (optional)"
                        value={tier.secondary_cta_label ?? ""}
                        onChange={(e) =>
                          updateTier(
                            index,
                            "secondary_cta_label",
                            e.target.value
                          )
                        }
                        placeholder="e.g. Calculate pricing"
                      />
                      <Input
                        label="Secondary CTA URL"
                        value={tier.secondary_cta_url ?? ""}
                        onChange={(e) =>
                          updateTier(
                            index,
                            "secondary_cta_url",
                            e.target.value
                          )
                        }
                        placeholder="https://..."
                      />

                      {/* Preferred for */}
                      <div className="col-span-2">
                        <Input
                          label="Preferred For (comma-separated)"
                          value={(tier.preferred_for ?? []).join(", ")}
                          onChange={(e) =>
                            updateTier(
                              index,
                              "preferred_for",
                              e.target.value
                                .split(",")
                                .map((f) => f.trim())
                                .filter(Boolean)
                            )
                          }
                          placeholder="Growing app teams, Reliable install measurement, ..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <Button variant="secondary" onClick={addTier}>
            <Plus className="h-4 w-4" />
            Add Tier
          </Button>
        </div>
      )}
    </div>
  );
}
