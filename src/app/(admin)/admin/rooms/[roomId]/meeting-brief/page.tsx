"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Download, Calendar, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { TabMeetingBrief } from "@/components/room/tab-meeting-brief";
import { TabNextSteps } from "@/components/room/tab-next-steps";
import {
  parseBrief,
  hasStructure,
  serializeBrief,
  parseNextSteps,
  serializeNextSteps,
  CANONICAL_SECTIONS,
  type BriefData,
} from "@/lib/meeting-brief";
import { computePalette } from "@/lib/palette";
import type { MeetingBrief, GranolaMeetingCache } from "@/lib/types";
import { formatDate } from "@/lib/utils";

/** One editable section: items live as one-per-line text in `body`. */
interface EditSection {
  key: string;
  title: string;
  canonical: boolean;
  body: string;
}

// Preview uses the default brand palette; the live prospect page applies the
// room's own color. Exact hue is verified there — here we confirm structure.
const PREVIEW_PALETTE = computePalette("#4d4bf7");
const PREVIEW_VARS = {
  "--brand-primary": PREVIEW_PALETTE.primary,
  "--brand-primary-light": PREVIEW_PALETTE.primaryLight,
  "--brand-primary-dark": PREVIEW_PALETTE.primaryDark,
} as React.CSSProperties;

/** Seed the five canonical sections (always shown), then append any extras. */
function seedSections(data: BriefData): EditSection[] {
  const byKey = new Map(data.sections.map((s) => [s.key, s]));
  const out: EditSection[] = CANONICAL_SECTIONS.map((c) => ({
    key: c.key,
    title: c.title,
    canonical: true,
    body: byKey.get(c.key)?.items.join("\n") ?? "",
  }));
  const canonicalKeys = new Set(CANONICAL_SECTIONS.map((c) => c.key));
  for (const s of data.sections) {
    if (!canonicalKeys.has(s.key)) {
      out.push({
        key: s.key,
        title: s.title,
        canonical: false,
        body: s.items.join("\n"),
      });
    }
  }
  return out;
}

function linesToItems(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function MeetingBriefPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const [mode, setMode] = useState<"structured" | "markdown">("structured");

  // Structured state
  const [snapshotDate, setSnapshotDate] = useState("");
  const [snapshotAttendees, setSnapshotAttendees] = useState("");
  const [sections, setSections] = useState<EditSection[]>(() =>
    seedSections({ snapshot: null, sections: [] }),
  );
  const [nextStepsText, setNextStepsText] = useState("");

  // Raw markdown state (legacy / escape hatch)
  const [rawContent, setRawContent] = useState("");
  const [rawNextSteps, setRawNextSteps] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Granola import state
  const [granolaDlgOpen, setGranolaDlgOpen] = useState(false);
  const [granolaMeetings, setGranolaMeetings] = useState<GranolaMeetingCache[]>(
    [],
  );
  const [granolaLoading, setGranolaLoading] = useState(false);
  const [granolaError, setGranolaError] = useState("");

  /** Populate every field from a content + next-steps markdown pair. */
  const loadFromStrings = useCallback(
    (content: string, nextStepsStr: string) => {
      setRawContent(content);
      setRawNextSteps(nextStepsStr);
      const parsed = parseBrief(content);
      setSnapshotDate(parsed.snapshot?.date ?? "");
      setSnapshotAttendees(parsed.snapshot?.attendees ?? "");
      setSections(seedSections(parsed));
      setNextStepsText(parseNextSteps(nextStepsStr).join("\n"));
      // New/empty or cleanly-structured briefs edit as sections; freeform
      // legacy content stays in raw markdown so nothing is mangled.
      setMode(!content.trim() || hasStructure(parsed) ? "structured" : "markdown");
    },
    [],
  );

  useEffect(() => {
    async function fetchBrief() {
      try {
        const res = await fetch(`/api/rooms/${roomId}/meeting-brief`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const brief: MeetingBrief = data.meeting_brief;
        loadFromStrings(brief.content ?? "", brief.next_steps ?? "");
      } catch {
        setError("Failed to load meeting brief");
      } finally {
        setLoading(false);
      }
    }
    fetchBrief();
  }, [roomId, loadFromStrings]);

  function buildBriefData(): BriefData {
    const snapshot =
      snapshotDate.trim() || snapshotAttendees.trim()
        ? { date: snapshotDate.trim(), attendees: snapshotAttendees.trim() }
        : null;
    const built = sections
      .map((s) => ({
        key: s.key,
        title: s.title,
        ordered: false,
        items: linesToItems(s.body),
      }))
      .filter((s) => s.items.length > 0);
    return { snapshot, sections: built };
  }

  function currentContent(): string {
    return mode === "markdown" ? rawContent : serializeBrief(buildBriefData());
  }
  function currentNextStepsMd(): string {
    return mode === "markdown"
      ? rawNextSteps
      : serializeNextSteps(linesToItems(nextStepsText));
  }

  function switchToMarkdown() {
    setRawContent(serializeBrief(buildBriefData()));
    setRawNextSteps(serializeNextSteps(linesToItems(nextStepsText)));
    setMode("markdown");
  }
  function switchToStructured() {
    const parsed = parseBrief(rawContent);
    setSnapshotDate(parsed.snapshot?.date ?? "");
    setSnapshotAttendees(parsed.snapshot?.attendees ?? "");
    setSections(seedSections(parsed));
    setNextStepsText(parseNextSteps(rawNextSteps).join("\n"));
    setMode("structured");
  }

  function updateSection(key: string, body: string) {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, body } : s)),
    );
  }

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/meeting-brief`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentContent(),
          next_steps: currentNextStepsMd(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Meeting brief saved");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const fetchGranolaMeetings = useCallback(async () => {
    setGranolaLoading(true);
    setGranolaError("");
    try {
      const res = await fetch("/api/granola/meetings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGranolaMeetings(data.meetings);
    } catch (err) {
      setGranolaError(
        err instanceof Error ? err.message : "Failed to load Granola meetings",
      );
    } finally {
      setGranolaLoading(false);
    }
  }, []);

  function handleOpenGranola() {
    setGranolaDlgOpen(true);
    fetchGranolaMeetings();
  }

  function handleSelectMeeting(meeting: GranolaMeetingCache) {
    const rawBrief = meeting.meeting_brief || "";

    if (rawBrief) {
      const { content: briefContent, nextStepsText: importedSteps } =
        splitImportedBrief(rawBrief);
      loadFromStrings(briefContent, importedSteps);
    } else {
      const header = `# ${meeting.title}\n\n`;
      const dateLine = `**Date:** ${formatDate(meeting.meeting_date)}\n\n`;
      const participantNames = meeting.participants
        .map((p) => {
          const parts = [p.name];
          if (p.company) parts.push(`(${p.company})`);
          return parts.join(" ");
        })
        .join(", ");
      const participantsLine = participantNames
        ? `**Participants:** ${participantNames}\n\n---\n\n`
        : "---\n\n";
      loadFromStrings(header + dateLine + participantsLine + meeting.summary, "");
    }

    setGranolaDlgOpen(false);
    setSuccess("Meeting notes imported from Granola");
    setTimeout(() => setSuccess(""), 3000);
  }

  /** Split a structured meeting brief into recap content and next steps. */
  function splitImportedBrief(brief: string): {
    content: string;
    nextStepsText: string;
  } {
    const nextStepsMatch = brief.match(
      /\n(NEXT STEPS\b[\s\S]*?)(?=\nREADINESS:|$)/i,
    );
    if (!nextStepsMatch) {
      return {
        content: brief.replace(/\nREADINESS:[\s\S]*$/i, "").trim(),
        nextStepsText: "",
      };
    }
    const nextStepsText = nextStepsMatch[1]
      .replace(/^NEXT STEPS\s*/i, "")
      .trim();
    const contentEnd = brief.indexOf(nextStepsMatch[0]);
    const content = brief
      .slice(0, contentEnd)
      .replace(/\nREADINESS:[\s\S]*$/i, "")
      .trim();
    return { content, nextStepsText };
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meeting Brief</h1>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleOpenGranola}>
            <Download className="h-4 w-4" />
            Import from Granola
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              mode === "structured" ? switchToMarkdown() : switchToStructured()
            }
          >
            {mode === "structured" ? "Markdown" : "Structured"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? "Edit" : "Preview"}
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save
          </Button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

      {showPreview ? (
        <div
          style={PREVIEW_VARS}
          className="space-y-10 rounded-xl border border-gray-200 bg-gray-50 p-6 sm:p-8"
        >
          <TabMeetingBrief
            meetingBrief={{ content: currentContent() } as MeetingBrief}
          />
          <TabNextSteps nextSteps={currentNextStepsMd()} />
        </div>
      ) : mode === "structured" ? (
        <div className="space-y-6">
          {/* Snapshot */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Meeting Snapshot
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Shown as a summary strip at the top of the recap.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Date"
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
                placeholder="May 28, 2026"
              />
              <Input
                label="Attendees"
                value={snapshotAttendees}
                onChange={(e) => setSnapshotAttendees(e.target.value)}
                placeholder="Yash (Linkrunner), Priya & Arjun (Chai Shots)"
              />
            </div>
          </div>

          {/* Sections */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-500">
              What we discussed so far
            </h2>
            <p className="mb-5 text-sm text-gray-500">
              One item per line &mdash; each line becomes a bullet. Leave a
              section empty to hide it.
            </p>
            <div className="space-y-5">
              {sections.map((section) => (
                <Textarea
                  key={section.key}
                  label={
                    section.canonical
                      ? section.title
                      : `${section.title} (extra)`
                  }
                  value={section.body}
                  onChange={(e) => updateSection(section.key, e.target.value)}
                  rows={4}
                  placeholder="One point per line..."
                />
              ))}
            </div>
          </div>

          {/* Next steps */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Next Steps
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              One step per line &mdash; rendered as a numbered checklist.
            </p>
            <Textarea
              value={nextStepsText}
              onChange={(e) => setNextStepsText(e.target.value)}
              rows={6}
              placeholder={
                "Send pricing and deck over email\nSchedule a follow-up call\nSet up a shared WhatsApp group"
              }
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Editing raw markdown. Switch to{" "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={switchToStructured}
            >
              Structured
            </button>{" "}
            to edit as visual sections.
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              What we discussed so far
            </h2>
            <Textarea
              label="Content (Markdown supported)"
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              rows={14}
              placeholder="Write the meeting brief here... Markdown is supported."
            />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Next Steps
            </h2>
            <Textarea
              label="Next steps (Markdown supported)"
              value={rawNextSteps}
              onChange={(e) => setRawNextSteps(e.target.value)}
              rows={6}
              placeholder="- Send email with pricing and deck&#10;- Schedule follow-up call"
            />
          </div>
        </div>
      )}

      {/* ---- Granola Import Dialog ---- */}
      <Dialog
        open={granolaDlgOpen}
        onClose={() => setGranolaDlgOpen(false)}
        title="Import from Granola"
        description="Select a meeting to import its notes as the meeting brief."
        className="max-w-2xl"
      >
        {granolaLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4d4bf7] border-t-transparent" />
            <span className="ml-3 text-sm text-gray-500">
              Loading meetings...
            </span>
          </div>
        )}

        {granolaError && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Failed to load meetings</p>
            <p className="mt-1">{granolaError}</p>
            <p className="mt-2 text-red-600">
              Make sure meetings are synced. You can sync meetings by asking
              Claude to import your Granola meetings.
            </p>
          </div>
        )}

        {!granolaLoading && !granolaError && granolaMeetings.length === 0 && (
          <div className="py-8 text-center">
            <Calendar className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-700">
              No meetings synced yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Ask Claude to sync your Granola meetings to get started.
            </p>
          </div>
        )}

        {!granolaLoading && granolaMeetings.length > 0 && (
          <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
            {granolaMeetings.map((meeting) => (
              <button
                key={meeting.id}
                type="button"
                onClick={() => handleSelectMeeting(meeting)}
                className="w-full rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-[#4d4bf7] hover:bg-[#e6ecff]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d4bf7]"
              >
                <p className="font-medium text-gray-900">{meeting.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(meeting.meeting_date)}
                  </span>
                  {meeting.company_name && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {meeting.company_name}
                    </span>
                  )}
                  {meeting.participants.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {meeting.participants.length} participants
                    </span>
                  )}
                </div>
                {meeting.summary && (
                  <p className="mt-2 line-clamp-2 text-xs text-gray-400">
                    {meeting.summary.slice(0, 150)}...
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
}
