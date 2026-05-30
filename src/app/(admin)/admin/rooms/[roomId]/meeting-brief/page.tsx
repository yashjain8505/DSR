"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Download,
  Calendar,
  Users,
  Building2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { Dialog } from "@/components/ui/dialog";
import { TabMeetingBrief } from "@/components/room/tab-meeting-brief";
import { TabNextSteps } from "@/components/room/tab-next-steps";
import {
  parseBrief,
  hasStructure,
  serializeBrief,
  CANONICAL_SECTIONS,
  type BriefData,
} from "@/lib/meeting-brief";
import {
  parseNextStepsData,
  serializeNextStepsData,
  makeStep,
  emptyNextStepsData,
  type NextStepsData,
  type NextStep,
  type TeamKey,
} from "@/lib/next-steps";
import { computePalette } from "@/lib/palette";
import type { MeetingBrief, GranolaMeetingCache } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

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
  const [nextStepsData, setNextStepsData] = useState<NextStepsData>(() =>
    emptyNextStepsData(),
  );

  // Raw markdown state for the recap escape hatch.
  const [rawContent, setRawContent] = useState("");

  // Customer identity for next-steps team tags + a faithful preview.
  const [customerLogoUrl, setCustomerLogoUrl] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");

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
      const parsed = parseBrief(content);
      setSnapshotDate(parsed.snapshot?.date ?? "");
      setSnapshotAttendees(parsed.snapshot?.attendees ?? "");
      setSections(seedSections(parsed));
      setNextStepsData(parseNextStepsData(nextStepsStr));
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
    async function fetchRoom() {
      // Customer logo + name power the next-steps team tags and preview.
      // Non-blocking: failure just falls back to a generic "Customer" label.
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        const data = await res.json();
        if (res.ok && data.room) {
          setCustomerLogoUrl(data.room.logo_url ?? null);
          setCustomerName(data.room.company_name ?? "");
        }
      } catch {
        /* ignore — team tags still render with a fallback monogram */
      }
    }
    fetchBrief();
    fetchRoom();
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
  function currentNextSteps(): string {
    return serializeNextStepsData(nextStepsData);
  }

  // The Markdown/Structured toggle governs only the recap content. Next steps
  // is always edited via the structured action-plan editor, so its rich fields
  // (completion, date, team tags) can never be lost in a markdown round-trip.
  function switchToMarkdown() {
    setRawContent(serializeBrief(buildBriefData()));
    setMode("markdown");
  }
  function switchToStructured() {
    const parsed = parseBrief(rawContent);
    setSnapshotDate(parsed.snapshot?.date ?? "");
    setSnapshotAttendees(parsed.snapshot?.attendees ?? "");
    setSections(seedSections(parsed));
    setMode("structured");
  }

  function updateSection(key: string, body: string) {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, body } : s)),
    );
  }

  /* ---- Next-steps (mutual action plan) mutations ---- */
  function setShowTeamLogos(showTeamLogos: boolean) {
    setNextStepsData((prev) => ({
      ...prev,
      config: { ...prev.config, showTeamLogos },
    }));
  }
  function addStep() {
    setNextStepsData((prev) => ({
      ...prev,
      steps: [...prev.steps, makeStep()],
    }));
  }
  function updateStep(updated: NextStep) {
    setNextStepsData((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === updated.id ? updated : s)),
    }));
  }
  function removeStep(id: string) {
    setNextStepsData((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== id),
    }));
  }
  function moveStep(id: string, dir: -1 | 1) {
    setNextStepsData((prev) => {
      const idx = prev.steps.findIndex((s) => s.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= prev.steps.length) return prev;
      const steps = [...prev.steps];
      [steps[idx], steps[j]] = [steps[j], steps[idx]];
      return { ...prev, steps };
    });
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
          next_steps: currentNextSteps(),
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
          <TabNextSteps
            nextSteps={currentNextSteps()}
            customerLogoUrl={customerLogoUrl}
            customerName={customerName}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {mode === "structured" ? (
            <>
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

            </>
          ) : (
            <>
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
            </>
          )}

          {/* Next Steps — shared mutual action plan editor (both edit modes) */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-1 flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Next Steps
              </h2>
              <Toggle
                checked={nextStepsData.config.showTeamLogos}
                onChange={setShowTeamLogos}
                label="Show team logos"
              />
            </div>
            <p className="mb-5 text-sm text-gray-500">
              A shared action plan &mdash; mark items done, set a date, and choose
              which team owns each step.
            </p>
            <div className="space-y-3">
              {nextStepsData.steps.map((step, i) => (
                <StepEditorRow
                  key={step.id}
                  step={step}
                  index={i}
                  total={nextStepsData.steps.length}
                  customerName={customerName}
                  onChange={updateStep}
                  onRemove={removeStep}
                  onMove={moveStep}
                />
              ))}
              {nextStepsData.steps.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
                  No steps yet. Add your first action item below.
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={addStep}
              className="mt-4"
            >
              <Plus className="h-4 w-4" />
              Add step
            </Button>
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

/** One editable next-step row: completion, title, description, date, teams. */
function StepEditorRow({
  step,
  index,
  total,
  customerName,
  onChange,
  onRemove,
  onMove,
}: {
  step: NextStep;
  index: number;
  total: number;
  customerName: string;
  onChange: (step: NextStep) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  function toggleTeam(team: TeamKey) {
    const teams = step.teams.includes(team)
      ? step.teams.filter((t) => t !== team)
      : [...step.teams, team];
    onChange({ ...step, teams });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
      <div className="flex items-start gap-3">
        {/* Completed toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...step, completed: !step.completed })}
          aria-pressed={step.completed}
          title={step.completed ? "Mark as not done" : "Mark as done"}
          className={cn(
            "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            step.completed
              ? "border-[#4d4bf7] bg-[#4d4bf7] text-white"
              : "border-gray-300 bg-white text-transparent hover:border-[#4d4bf7]",
          )}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </button>

        {/* Fields */}
        <div className="flex-1 space-y-2.5">
          <Input
            value={step.title}
            onChange={(e) => onChange({ ...step, title: e.target.value })}
            placeholder="Step title (e.g. Send pricing & deck)"
          />
          <Input
            value={step.description}
            onChange={(e) => onChange({ ...step, description: e.target.value })}
            placeholder="Optional description"
          />
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Date
              </label>
              <input
                type="date"
                value={step.date ?? ""}
                onChange={(e) =>
                  onChange({ ...step, date: e.target.value || null })
                }
                className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm text-[#0f172a] focus:border-[#4d4bf7] focus:outline-none focus:ring-2 focus:ring-[#c9d4ff]"
              />
            </div>
            <div>
              <span className="mb-1 block text-xs font-medium text-gray-500">
                Owned by
              </span>
              <div className="flex items-center gap-2">
                <TeamChip
                  active={step.teams.includes("linkrunner")}
                  label="Linkrunner"
                  onClick={() => toggleTeam("linkrunner")}
                />
                <TeamChip
                  active={step.teams.includes("customer")}
                  label={customerName || "Customer"}
                  onClick={() => toggleTeam("customer")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row controls */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(step.id, -1)}
            disabled={index === 0}
            title="Move up"
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(step.id, 1)}
            disabled={index === total - 1}
            title="Move down"
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(step.id)}
            title="Remove step"
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** A pill toggle for assigning a team to a step. */
function TeamChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-[#4d4bf7] bg-[#e6ecff] text-[#4d4bf7]"
          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300",
      )}
    >
      {label}
    </button>
  );
}
