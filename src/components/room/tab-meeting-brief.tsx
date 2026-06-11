import {
  Building2,
  TriangleAlert,
  Sparkles,
  ShieldCheck,
  Target,
  FileText,
  Calendar,
  Users,
  HelpCircle,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { parseBrief, hasStructure, type BriefSection } from "@/lib/meeting-brief";
import type { MeetingBrief } from "@/lib/types";

interface TabMeetingBriefProps {
  meetingBrief: MeetingBrief;
}

/** Per-section icon. */
const SECTION_ICONS: Record<string, React.ElementType> = {
  situation: Building2,
  pain_points: TriangleAlert,
  what_we_showed: Sparkles,
  questions: HelpCircle,
  security: ShieldCheck,
  why_it_matters: Target,
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
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          What we discussed so far
        </h2>
        <p className="mt-2 text-base text-gray-500">
          A recap of our conversation, prepared for your team
        </p>
      </div>

      {/* Content card */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm">
        {/* Snapshot strip (date + attendees) always renders when present */}
        {brief.snapshot && <SnapshotStrip snapshot={brief.snapshot} />}

        {structured ? (
          <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
            {brief.sections.map((section) => (
              <Section key={section.key} section={section} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <MarkdownRenderer
              content={content}
              className="[&_li]:leading-7 [&_ul]:space-y-1 [&_ol]:space-y-1"
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
    <div className="flex flex-col gap-2 bg-gray-100 px-6 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:px-10">
      {snapshot.date && (
        <span className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 shrink-0 text-gray-500" />
          <span className="font-medium text-gray-900">{snapshot.date}</span>
        </span>
      )}
      {snapshot.attendees && (
        <span className="flex items-start gap-2 text-sm text-gray-600">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          <span>{snapshot.attendees}</span>
        </span>
      )}
    </div>
  );
}

function Section({ section }: { section: BriefSection }) {
  const Icon = SECTION_ICONS[section.key] ?? FileText;

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <h3 className="text-base font-semibold text-gray-900">
          {section.title}
        </h3>
      </div>
      <ul className="space-y-2.5 pl-11">
        {section.items.map((item, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-7 text-gray-700">
            <Marker index={i} ordered={section.ordered} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Marker({ index, ordered }: { index: number; ordered: boolean }) {
  if (ordered) {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-700">
        {index + 1}
      </span>
    );
  }
  return (
    <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
  );
}
