"use client";

import type { CustomerReference } from "@/lib/types";

interface CustomersReferencesProps {
  references: CustomerReference[];
}

/**
 * "Our Customers & References" — logo wall of customer logos.
 * Now driven by per-room data from the customer_references table.
 * Only shows references where is_visible is true.
 */
export function CustomersReferences({ references }: CustomersReferencesProps) {
  const visible = references
    .filter((r) => r.is_visible && r.logo_url)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (visible.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        No customer references added yet.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h2
          className="text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ color: "var(--brand-primary, #4d4bf7)" }}
        >
          Working with leading apps
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
          Trusted by 250+ customers across 3 countries to measure and grow what
          matters.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {visible.map((ref) => (
            <div
              key={ref.id}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm"
            >
              <img
                src={ref.logo_url}
                alt={ref.name}
                className="max-h-10 max-w-[130px] object-contain"
              />
              <span className="text-xs font-medium text-gray-500">
                {ref.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
