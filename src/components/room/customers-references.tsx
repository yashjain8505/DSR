"use client";

import { CUSTOMER_PLAY_STORE_LINKS } from "@/lib/constants";
import type { CustomerReference } from "@/lib/types";

interface CustomersReferencesProps {
  references: CustomerReference[];
}

/** Rectangular flag images (flagcdn), so flags render exact, not as rounded emoji. */
const FLAGS = [
  { code: "in", title: "India" },
  { code: "us", title: "United States" },
  { code: "br", title: "Brazil" },
  { code: "id", title: "Indonesia" },
  { code: "kr", title: "South Korea" },
  { code: "np", title: "Nepal" },
  { code: "gr", title: "Greece" },
];

/**
 * "Our Customers & References" — logo wall of customer logos.
 * Driven by per-room data from the customer_references table.
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
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Working with leading apps
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
          Trusted by 250+ customers across 10 countries.
        </p>
        <div
          className="mt-4 flex flex-wrap items-center justify-center gap-2"
          aria-label="Customer countries"
        >
          {FLAGS.map((f) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={f.code}
              src={`https://flagcdn.com/w40/${f.code}.png`}
              alt={f.title}
              title={f.title}
              width={24}
              height={18}
              className="h-[18px] w-6 object-cover"
            />
          ))}
          <span className="text-xs font-medium text-gray-400">+ more</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 sm:p-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {visible.map((ref) => {
            const link = CUSTOMER_PLAY_STORE_LINKS[ref.name];
            const cardClass =
              "flex flex-col items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-4";
            const inner = (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ref.logo_url}
                  alt={ref.name}
                  className="max-h-10 max-w-[130px] object-contain"
                />
                <span className="text-xs font-medium text-gray-500">
                  {ref.name}
                </span>
              </>
            );
            return link ? (
              <a
                key={ref.id}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cardClass} transition-colors hover:bg-gray-200`}
                title={`${ref.name} on the Play Store`}
              >
                {inner}
              </a>
            ) : (
              <div key={ref.id} className={cardClass}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
