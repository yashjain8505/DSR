import {
  Building2,
  TriangleAlert,
  Sparkles,
  ShieldCheck,
  Target,
  FileText,
  Calendar,
  Users,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { parseBrief, hasStructure, type BriefSection } from "@/lib/meeting-brief";
import type { MeetingBrief } from "@/lib/types";

interface TabMeetingBriefProps {
  meetingBrief: MeetingBrief;
}

/** Per-section icon + accent. "amber" flags problems; everything else is brand. */
const SECTION_STYLE: Record<
  string,
  { Icon: React.ElementType; accent: "brand" | "amber" }
> = {
  situation: { Icon: Building2, accent: "brand" },
  pain_points: { Icon: TriangleAlert, accent: "amber" },
  what_we_showed: { Icon: Sparkles, accent: "brand" },
  security: { Icon: ShieldCheck, accent: "brand" },
  why_it_matters: { Icon: Target, accent: "brand" },
};

/**
 * Meeting Brief tab content ("What we discussed so far").
 * Renders the brief as scannable, icon-led sections. Briefs that don't parse
 * into a clear structure fall back to the plain markdown renderer.
 */
export function TabMeetingBrief({ meetingBrief }: TabMeetingBriefProps) {
  const content = meetingBrief?.content ?? "";
  const brief = parseBrief(content);
  const structured = hasStructure(brief);

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
          borderColor: "color-mix(in srgb, var(--brand-primary) 20%, #e5e7eb)",
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

        {structured ? (
          <>
            {brief.snapshot && <SnapshotStrip snapshot={brief.snapshot} />}
            <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
              {brief.sections.map((section) => (
                <Section key={section.key} section={section} />
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <MarkdownRenderer
              content={content}
              className="[&_h1]:text-[var(--brand-primary-dark)] [&_h2]:text-[var(--brand-primary-dark)] [&_h3]:text-[var(--brand-primary-dark)] [&_li]:leading-7 [&_ul]:space-y-1 [&_ol]:space-y-1"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SnapshotStrip({
  snapshot,
}: {
  snapshot: { date: string; attendees: string };
}) {
  return (
    <div
      className="flex flex-col gap-2 border-b px-6 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:px-10"
      style={{
        borderColor: "color-mix(in srgb, var(--brand-primary) 12%, #e5e7eb)",
        background: "color-mix(in srgb, var(--brand-primary) 5%, #ffffff)",
      }}
    >
      {snapshot.date && (
        <span className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--brand-primary)" }}
          />
          <span className="font-medium text-gray-900">{snapshot.date}</span>
        </span>
      )}
      {snapshot.attendees && (
        <span className="flex items-start gap-2 text-sm text-gray-600">
          <Users
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: "var(--brand-primary)" }}
          />
          <span>{snapshot.attendees}</span>
        </span>
      )}
    </div>
  );
}

function Section({ section }: { section: BriefSection }) {
  const style = SECTION_STYLE[section.key] ?? { Icon: FileText, accent: "brand" };
  const { Icon, accent } = style;
  const isAmber = accent === "amber";

  const chipStyle = isAmber
    ? { background: "#fffbeb", color: "#d97706" }
    : {
        background: "var(--brand-primary-light)",
        color: "var(--brand-primary)",
      };

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={chipStyle}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <h3 className="text-base font-semibold text-gray-900">
          {section.title}
        </h3>
      </div>
      <ul className="space-y-2.5 pl-11">
        {section.items.map((item, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-7 text-gray-700">
            <Marker index={i} ordered={section.ordered} amber={isAmber} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Marker({
  index,
  ordered,
  amber,
}: {
  index: number;
  ordered: boolean;
  amber: boolean;
}) {
  if (ordered) {
    return (
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
        style={
          amber
            ? { background: "#fffbeb", color: "#d97706" }
            : {
                background: "var(--brand-primary-light)",
                color: "var(--brand-primary)",
              }
        }
      >
        {index + 1}
      </span>
    );
  }
  return (
    <span
      className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: amber ? "#d97706" : "var(--brand-primary)" }}
    />
  );
}
