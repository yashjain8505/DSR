"use client";

import { useState } from "react";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import type { Comparison, ComparisonFeature } from "@/lib/types";

interface TabComparisonsProps {
  comparisons: Comparison[];
}

/**
 * Comparisons tab. If multiple competitors exist, shows a selector bar.
 * Renders a structured comparison table when comparison_data is available,
 * otherwise falls back to markdown content.
 */
export function TabComparisons({ comparisons }: TabComparisonsProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (comparisons.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        No comparisons available yet.
      </div>
    );
  }

  const activeComparison = comparisons[activeIdx];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">How We Compare</h2>
        <p className="mt-1 text-sm text-gray-500">
          See how Linkrunner stacks up
        </p>
      </div>

      {/* Competitor selector (only when multiple) */}
      {comparisons.length > 1 && (
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {comparisons.map((comp, i) => (
            <button
              key={comp.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
                activeIdx === i
                  ? "bg-[var(--brand-primary)] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {comp.competitor_logo_url && (
                <img
                  src={comp.competitor_logo_url}
                  alt=""
                  className="mr-2 inline-block h-4 w-4 rounded object-contain"
                />
              )}
              vs {comp.competitor_name}
            </button>
          ))}
        </div>
      )}

      {/* Comparison content */}
      {activeComparison.comparison_data &&
      activeComparison.comparison_data.length > 0 ? (
        <ComparisonTable
          features={activeComparison.comparison_data}
          competitorName={activeComparison.competitor_name}
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <MarkdownRenderer content={activeComparison.content} />
        </div>
      )}

      {/* Show supplementary markdown below the table if both exist */}
      {activeComparison.comparison_data &&
        activeComparison.comparison_data.length > 0 &&
        activeComparison.content && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
            <MarkdownRenderer content={activeComparison.content} />
          </div>
        )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ComparisonTable({
  features,
  competitorName,
}: {
  features: ComparisonFeature[];
  competitorName: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-left font-semibold text-gray-900">
              Feature
            </th>
            <th className="px-6 py-3 text-center font-semibold text-[var(--brand-primary)]">
              Linkrunner
            </th>
            <th className="px-6 py-3 text-center font-semibold text-gray-600">
              {competitorName}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {features.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-medium text-gray-900">
                {row.feature}
              </td>
              <td className="px-6 py-4 text-center">
                <CellValue value={row.linkrunner} isLinkrunner />
              </td>
              <td className="px-6 py-4 text-center">
                <CellValue value={row.competitor} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CellValue({
  value,
  isLinkrunner = false,
}: {
  value: string;
  isLinkrunner?: boolean;
}) {
  const lower = value.toLowerCase().trim();

  if (lower === "true" || lower === "yes" || lower === "check") {
    return (
      <span className="inline-flex items-center justify-center">
        <Check
          className={cn(
            "h-5 w-5",
            isLinkrunner ? "text-green-600" : "text-green-500"
          )}
        />
      </span>
    );
  }

  if (lower === "false" || lower === "no" || lower === "x") {
    return (
      <span className="inline-flex items-center justify-center">
        <X className="h-5 w-5 text-red-400" />
      </span>
    );
  }

  // Plain text value
  return (
    <span className={cn("text-sm", isLinkrunner ? "text-gray-900 font-medium" : "text-gray-600")}>
      {value}
    </span>
  );
}
