import { ArrowRight } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { parseNextSteps } from "@/lib/meeting-brief";

interface TabNextStepsProps {
  nextSteps: string;
}

/**
 * Next Steps tab content.
 * Renders steps as a numbered, scannable checklist. Content that doesn't
 * parse into discrete steps falls back to the plain markdown renderer.
 */
export function TabNextSteps({ nextSteps }: TabNextStepsProps) {
  const content = nextSteps ?? "";
  const steps = parseNextSteps(content);
  const hasContent = !!content.trim();

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
          {steps.length > 0 ? (
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <StepRow key={i} index={i} text={step} />
              ))}
            </ol>
          ) : hasContent ? (
            <MarkdownRenderer
              content={content}
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

function StepRow({ index, text }: { index: number; text: string }) {
  return (
    <li
      className="flex items-start gap-4 rounded-xl border p-4 transition-colors"
      style={{
        borderColor: "color-mix(in srgb, var(--brand-primary) 12%, #e5e7eb)",
        background: "color-mix(in srgb, var(--brand-primary) 4%, #ffffff)",
      }}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        style={{
          background: "var(--brand-primary)",
          color: "#ffffff",
        }}
      >
        {index + 1}
      </span>
      <span className="flex-1 pt-0.5 text-[15px] leading-7 text-gray-700">
        {text}
      </span>
      <ArrowRight
        className="mt-1.5 h-4 w-4 shrink-0"
        style={{ color: "color-mix(in srgb, var(--brand-primary) 50%, #ffffff)" }}
      />
    </li>
  );
}
