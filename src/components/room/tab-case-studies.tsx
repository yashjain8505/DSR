"use client";

import { ExternalLink } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import type { CaseStudy } from "@/lib/types";

interface TabCaseStudiesProps {
  caseStudies: CaseStudy[];
}

/**
 * Case Studies tab. Renders banner cards that link to the full story on linkrunner.io.
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

      <div className="grid gap-6 sm:grid-cols-2">
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
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      {/* Banner image */}
      {study.banner_url && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
          <img
            src={study.banner_url}
            alt={study.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Customer info */}
        <div className="mb-3 flex items-center gap-3">
          {study.customer_logo_url ? (
            <img
              src={study.customer_logo_url}
              alt={`${study.customer_name} logo`}
              className="h-8 w-8 rounded-lg border border-gray-100 object-contain"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
              {study.customer_name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-semibold text-gray-700">
            {study.customer_name}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-3 text-base font-bold text-gray-900 group-hover:text-[var(--brand-primary)]">
          {study.title}
        </h3>

        {/* Summary content */}
        <div className="flex-1 text-sm leading-relaxed text-gray-600">
          <MarkdownRenderer content={study.content} />
        </div>

        {/* Link indicator */}
        {study.url && (
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-primary)]">
            Read full story
            <ExternalLink className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </Wrapper>
  );
}
