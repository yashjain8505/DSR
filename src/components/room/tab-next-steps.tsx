import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

interface TabNextStepsProps {
  nextSteps: string;
}

/**
 * Next Steps tab content.
 * Renders actionable next steps as a checklist-style card
 * with brand-colored accents.
 */
export function TabNextSteps({ nextSteps }: TabNextStepsProps) {
  const hasContent = !!nextSteps?.trim();

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header with brand accent bar */}
      <div className="mb-8 flex items-start gap-4">
        <div
          className="mt-1 h-12 w-1.5 shrink-0 rounded-full"
          style={{ background: "var(--brand-primary)" }}
        />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Next Steps
          </h2>
          <p className="mt-2 text-base text-gray-500">
            What&rsquo;s coming up next in our partnership
          </p>
        </div>
      </div>

      {/* Content card */}
      <div
        className="relative overflow-hidden rounded-2xl border bg-white shadow-sm"
        style={{
          borderColor:
            "color-mix(in srgb, var(--brand-primary) 20%, #e5e7eb)",
        }}
      >
        {/* Top brand gradient strip */}
        <div
          className="h-1.5"
          style={{
            background:
              "linear-gradient(90deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 40%, #4d4bf7))",
          }}
        />

        {/* Body */}
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          {hasContent ? (
            <MarkdownRenderer
              content={nextSteps}
              className="[&_h1]:text-[var(--brand-primary-dark)] [&_h2]:text-[var(--brand-primary-dark)] [&_h3]:text-[var(--brand-primary-dark)] [&_li]:leading-7 [&_ul]:space-y-1 [&_ol]:space-y-1"
            />
          ) : (
            <p className="text-sm italic text-gray-400">
              Next steps will be shared here soon.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
