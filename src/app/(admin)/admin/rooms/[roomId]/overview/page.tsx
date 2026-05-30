"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Package, ExternalLink, Check } from "lucide-react";
import {
  ASSET_MANAGED_SUB_TABS,
  OVERVIEW_SUB_TAB_LABELS,
} from "@/lib/constants";
import type { OverviewSubTab, Asset } from "@/lib/types";
import { CustomersReferences } from "@/components/room/customers-references";

export default function OverviewEditorPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await fetch("/api/assets");
        const data = await res.json();
        if (res.ok) setAssets(data.assets ?? []);
      } catch {
        /* best-effort */
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, [roomId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-100" />
      </div>
    );
  }

  // Check which asset-managed sub-tabs have content
  const populatedCategories = new Set(
    assets.filter((a) => a.content?.trim()).map((a) => a.category)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Product & Why Linkrunner
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          These sections use shared content from the global Assets library
        </p>
      </div>

      {/* Info card */}
      <div className="mb-8 rounded-xl border border-[#4d4bf7]/20 bg-[#e6ecff]/30 p-6">
        <div className="flex items-start gap-3">
          <Package className="mt-0.5 h-5 w-5 shrink-0 text-[#4d4bf7]" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Content managed in Assets
            </p>
            <p className="mt-1 text-sm text-gray-600">
              The Product and Why Linkrunner tabs use the same content across
              every customer room. To edit what prospects see, update the content
              in the{" "}
              <Link
                href="/admin/assets"
                className="inline-flex items-center gap-1 font-medium text-[#4d4bf7] hover:underline"
              >
                Assets page
                <ExternalLink className="h-3 w-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Status grid showing which sections have content */}
      <div className="space-y-6">
        <SectionGroup
          label="Product Tab"
          keys={["what_is_linkrunner", "product_demo", "features", "how_it_works", "company_deck"]}
          populated={populatedCategories}
        />
        <SectionGroup
          label="Why Linkrunner Tab"
          keys={["differentiators", "integrations", "customers_references", "security_compliance"]}
          populated={populatedCategories}
        />
      </div>

      {/* Customers & References live preview */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#4d4bf7]">
          Customers &amp; References
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="mb-6 text-sm text-gray-500">
            This logo wall is built in and shows the same in every room. Logos
            are managed in code (
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              customers-references.tsx
            </code>
            ).
          </p>
          <CustomersReferences />
        </div>
      </div>
    </div>
  );
}

function SectionGroup({
  label,
  keys,
  populated,
}: {
  label: string;
  keys: string[];
  populated: Set<string>;
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#4d4bf7]">
        {label}
      </h2>
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {keys.map((key) => {
          const displayLabel =
            OVERVIEW_SUB_TAB_LABELS[key as keyof typeof OVERVIEW_SUB_TAB_LABELS] ?? key;
          const isHardCoded = key === "customers_references";
          const hasContent = isHardCoded || populated.has(key);

          return (
            <div
              key={key}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <span className="text-sm font-medium text-gray-700">
                {displayLabel}
              </span>
              <div className="flex items-center gap-2">
                {hasContent ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    <Check className="h-3 w-3" />
                    {isHardCoded ? "Built-in" : "Content added"}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                    Empty
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-end">
        <Link
          href="/admin/assets"
          className="text-xs font-medium text-[#4d4bf7] hover:underline"
        >
          Edit in Assets →
        </Link>
      </div>
    </div>
  );
}
