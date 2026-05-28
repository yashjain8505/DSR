"use client";

import { useState } from "react";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { Card, CardContent } from "@/components/ui/card";
import { cn, truncate } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CaseStudy } from "@/lib/types";

interface TabCaseStudiesProps {
  caseStudies: CaseStudy[];
}

/**
 * Case Studies tab. Renders a grid of expandable case study cards.
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
          See how other companies use Linkrunner
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
  const [expanded, setExpanded] = useState(false);
  const TRUNCATE_LENGTH = 200;
  const isLong = study.content.length > TRUNCATE_LENGTH;

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardContent className="flex flex-1 flex-col p-6">
        {/* Customer info */}
        <div className="mb-4 flex items-center gap-3">
          {study.customer_logo_url ? (
            <img
              src={study.customer_logo_url}
              alt={`${study.customer_name} logo`}
              className="h-10 w-10 rounded-lg border border-gray-100 object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-500">
              {study.customer_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {study.customer_name}
            </p>
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-3 text-base font-semibold text-gray-900">
          {study.title}
        </h3>

        {/* Content */}
        <div className="flex-1">
          {expanded || !isLong ? (
            <MarkdownRenderer content={study.content} />
          ) : (
            <p className="text-sm leading-6 text-gray-600">
              {truncate(study.content, TRUNCATE_LENGTH)}
            </p>
          )}
        </div>

        {/* Expand/collapse toggle */}
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className={cn(
              "mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-primary)]",
              "hover:text-[var(--brand-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded"
            )}
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Read more <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
