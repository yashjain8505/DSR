import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import type { MeetingBrief } from "@/lib/types";

interface TabMeetingBriefProps {
  meetingBrief: MeetingBrief;
}

/**
 * Meeting Brief tab content.
 * Renders the personalised brief the sales rep wrote for this prospect.
 * Styled with brand-colored accents and visual hierarchy.
 */
export function TabMeetingBrief({ meetingBrief }: TabMeetingBriefProps) {
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
            What we discussed so far
          </h2>
          <p className="mt-2 text-base text-gray-500">
            A recap of our conversation &mdash; prepared for your team
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
          <MarkdownRenderer
            content={meetingBrief.content}
            className="[&_h1]:text-[var(--brand-primary-dark)] [&_h2]:text-[var(--brand-primary-dark)] [&_h3]:text-[var(--brand-primary-dark)] [&_li]:leading-7 [&_ul]:space-y-1 [&_ol]:space-y-1"
          />
        </div>
      </div>
    </div>
  );
}
