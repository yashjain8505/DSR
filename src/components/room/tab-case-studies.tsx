"use client";

import { ExternalLink } from "lucide-react";
import type { CaseStudy } from "@/lib/types";

interface TabCaseStudiesProps {
  caseStudies: CaseStudy[];
}

/**
 * Case Studies tab. Compact cards with banner thumbnails linking to linkrunner.io.
 */
export function TabCaseStudies({ caseStudies }: TabCaseStudiesProps) {
  if (caseStudies.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        No case studies available yet.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Case Studies</h2>
        <p className="mt-1 text-sm text-gray-500">
          See how leading apps use Linkrunner to grow
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {caseStudies.map((study) => (
          <CaseStudyCard key={study.id} study={study} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CaseStudyCard({ study }: { study: CaseStudy }) {
  const Wrapper = study.url ? "a" : "div";
  const linkProps = study.url
    ? { href: study.url, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...linkProps}
      className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:shadow-md"
    >
      {/* Banner thumbnail */}
      {study.banner_url && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100">
          <img
            src={study.banner_url}
            alt={study.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5">
        {/* Customer name */}
        <div className="mb-1.5 flex items-center gap-2">
          {study.customer_logo_url ? (
            <img
              src={study.customer_logo_url}
              alt={study.customer_name}
              className="h-5 w-5 rounded object-contain"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-500">
              {study.customer_name.charAt(0)}
            </div>
          )}
          <span className="text-xs font-semibold text-gray-500">
            {study.customer_name}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold leading-snug text-gray-900">
          {study.title}
        </h3>

        {/* Link */}
        {study.url && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-600 group-hover:text-gray-900">
            Read story
            <ExternalLink className="h-3 w-3" />
          </div>
        )}
      </div>
    </Wrapper>
  );
}
