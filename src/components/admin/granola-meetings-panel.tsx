"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Building2,
  Users,
  Sparkles,
  CheckCircle2,
  Loader2,
  Search,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Pencil,
  Save,
  X,
  FileText,
  ScrollText,
  Flame,
  Thermometer,
  Snowflake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { GranolaMeetingCache } from "@/lib/types";

interface GranolaMeetingsPanelProps {
  existingCompanies: string[];
}

export function GranolaMeetingsPanel({
  existingCompanies,
}: GranolaMeetingsPanelProps) {
  const router = useRouter();
  const [meetings, setMeetings] = useState<GranolaMeetingCache[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [search, setSearch] = useState("");
  const [createdCompanies, setCreatedCompanies] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const existingSet = new Set(
    [...existingCompanies, ...createdCompanies].map((c) =>
      c.toLowerCase().trim()
    )
  );

  useEffect(() => {
    fetchMeetings();
  }, []);

  async function fetchMeetings() {
    try {
      setLoading(true);
      const res = await fetch("/api/granola/meetings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMeetings(data.meetings);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load meetings"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(meeting: GranolaMeetingCache) {
    setGeneratingId(meeting.id);
    try {
      const res = await fetch("/api/rooms/from-granola", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ granola_cache_id: meeting.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.room?.company_name) {
        setCreatedCompanies((prev) => [...prev, data.room.company_name]);
      }
      setGeneratingId(null);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to generate room"
      );
      setGeneratingId(null);
    }
  }

  async function handleDelete(meeting: GranolaMeetingCache) {
    if (!confirm(`Delete "${meeting.title}" from the meeting cache?`)) return;

    setDeletingId(meeting.id);
    try {
      const res = await fetch(`/api/granola/meetings/${meeting.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
      if (expandedId === meeting.id) setExpandedId(null);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to delete meeting"
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/granola/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        // Granola doesn't expose a public REST API — sync via Claude Code MCP
        if (data.error?.includes("GRANOLA_API_KEY") || data.error?.includes("404") || data.error?.includes("Not Found")) {
          setSyncMessage('Ask Claude Code to "sync granola" — Granola only works via MCP');
        } else {
          throw new Error(data.error);
        }
        return;
      }
      setSyncMessage(`Synced ${data.synced} meetings`);
      await fetchMeetings();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      if (msg.includes("404") || msg.includes("Not Found")) {
        setSyncMessage('Ask Claude Code to "sync granola" — Granola only works via MCP');
      } else {
        setSyncMessage(msg);
      }
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(""), 8000);
    }
  }

  const handleSaveSummary = useCallback(
    async (meetingId: string, newSummary: string) => {
      const res = await fetch(`/api/granola/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: newSummary }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      // Update local state
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meetingId ? { ...m, summary: newSummary } : m
        )
      );
    },
    []
  );

  const filteredMeetings = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return meetings;
    return meetings.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.company_name && m.company_name.toLowerCase().includes(q)) ||
        m.participants.some((p) => p.name.toLowerCase().includes(q))
    );
  }, [meetings, search]);

  function hasExistingRoom(meeting: GranolaMeetingCache): boolean {
    if (!meeting.company_name) return false;
    return existingSet.has(meeting.company_name.toLowerCase().trim());
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Granola Meetings
        </h2>
        <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading meetings...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Granola Meetings
        </h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Granola Meetings
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Click a meeting to view or edit notes. Generate rooms from demo
            calls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncMessage && (
            <span className="text-xs text-gray-500">{syncMessage}</span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync"}
          </button>
          <span className="rounded-full bg-[#e6ecff] px-3 py-1 text-xs font-medium text-[#4d4bf7]">
            {meetings.length} meetings
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meetings by title, company, or participant..."
          className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#4d4bf7] focus:outline-none focus:ring-2 focus:ring-[#c9d4ff]"
        />
      </div>

      {meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <p className="text-sm text-gray-500">No meetings synced yet.</p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#4d4bf7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3d3bc7]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync from Granola
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMeetings.map((meeting) => {
            const alreadyExists = hasExistingRoom(meeting);
            const isGenerating = generatingId === meeting.id;
            const isDeleting = deletingId === meeting.id;
            const isExpanded = expandedId === meeting.id;
            const hasSummary = !!meeting.summary;

            const prospectCount = meeting.participants.filter(
              (p) =>
                !p.is_creator &&
                !p.email?.endsWith("@linkrunner.io") &&
                p.name !== "Shreyans" &&
                p.name !== "Lakshith"
            ).length;

            const readiness = parseReadiness(meeting.meeting_brief);

            return (
              <div
                key={meeting.id}
                className={`overflow-hidden rounded-xl border bg-white transition-all ${
                  isExpanded
                    ? "border-[#4d4bf7]/30 shadow-sm"
                    : "border-gray-200"
                } ${isDeleting ? "opacity-50" : ""}`}
              >
                {/* Row header — clickable */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : meeting.id)
                  }
                  className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {meeting.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      {meeting.company_name && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Building2 className="h-3 w-3" />
                          {meeting.company_name}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(meeting.meeting_date)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Users className="h-3 w-3" />
                        {prospectCount} prospect{prospectCount !== 1 ? "s" : ""}
                      </span>
                      {readiness && <ReadinessBadge level={readiness} />}
                      {!hasSummary && !meeting.meeting_brief && (
                        <span className="text-xs text-amber-500">
                          No notes
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (stop propagation so clicks don't toggle expand) */}
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {alreadyExists ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Room exists
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleGenerate(meeting)}
                        loading={isGenerating}
                        disabled={isGenerating || !!generatingId}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate Room
                      </Button>
                    )}
                    <button
                      onClick={() => handleDelete(meeting)}
                      disabled={isDeleting}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      title="Delete meeting"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  )}
                </button>

                {/* Expanded panel — brief + transcript */}
                {isExpanded && (
                  <MeetingExpandedPanel
                    meeting={meeting}
                    onSave={handleSaveSummary}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Extract readiness level from meeting_brief text */
function parseReadiness(brief: string): "hot" | "warm" | "cool" | null {
  if (!brief) return null;
  const match = brief.match(/READINESS:\s*(Hot|Warm|Cool)/i);
  if (!match) return null;
  return match[1].toLowerCase() as "hot" | "warm" | "cool";
}

/** Readiness badge component */
function ReadinessBadge({ level }: { level: "hot" | "warm" | "cool" }) {
  const config = {
    hot: {
      label: "Hot",
      icon: Flame,
      className: "bg-red-50 text-red-600 ring-red-200",
    },
    warm: {
      label: "Warm",
      icon: Thermometer,
      className: "bg-amber-50 text-amber-600 ring-amber-200",
    },
    cool: {
      label: "Cool",
      icon: Snowflake,
      className: "bg-blue-50 text-blue-600 ring-blue-200",
    },
  };
  const c = config[level];
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${c.className}`}
    >
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}

/** Parse brief text into labelled sections for structured rendering */
function parseBriefSections(
  brief: string
): { heading: string; body: string }[] {
  const sections: { heading: string; body: string }[] = [];
  // Split on lines that look like section headings (ALL CAPS, possibly with — suffix)
  const lines = brief.split("\n");
  let currentHeading = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    // Match section headings like "THEIR SITUATION", "PAIN POINTS DISCUSSED", "MEETING SUMMARY — Company"
    if (/^[A-Z][A-Z\s—:]+/.test(line) && line.trim().length > 3) {
      if (currentHeading || currentBody.length > 0) {
        sections.push({
          heading: currentHeading,
          body: currentBody.join("\n").trim(),
        });
      }
      currentHeading = line.trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  if (currentHeading || currentBody.length > 0) {
    sections.push({
      heading: currentHeading,
      body: currentBody.join("\n").trim(),
    });
  }
  return sections;
}

/* ------------------------------------------------------------------ */

function MeetingExpandedPanel({
  meeting,
  onSave,
}: {
  meeting: GranolaMeetingCache;
  onSave: (meetingId: string, summary: string) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<"brief" | "transcript">(
    meeting.meeting_brief ? "brief" : "transcript"
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(meeting.summary);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(meeting.summary);
  }, [meeting.summary, editing]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(meeting.id, draft);
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(meeting.summary);
    setEditing(false);
  }

  // Prospect participants
  const prospects = meeting.participants.filter(
    (p) =>
      !p.is_creator &&
      !p.email?.endsWith("@linkrunner.io") &&
      p.name !== "Shreyans" &&
      p.name !== "Lakshith"
  );

  const hasBrief = !!meeting.meeting_brief;
  const hasTranscript = !!meeting.summary;
  const briefSections = hasBrief
    ? parseBriefSections(meeting.meeting_brief)
    : [];

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
      {/* Participants */}
      {prospects.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
            Participants
          </h4>
          <div className="flex flex-wrap gap-2">
            {prospects.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs text-gray-700 ring-1 ring-gray-200"
              >
                {p.name}
                {p.email && (
                  <span className="ml-1 text-gray-400">{p.email}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs — only show when both exist */}
      {hasBrief && hasTranscript && (
        <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-0.5">
          <button
            onClick={() => setActiveTab("brief")}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "brief"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Meeting Brief
          </button>
          <button
            onClick={() => setActiveTab("transcript")}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "transcript"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ScrollText className="h-3.5 w-3.5" />
            Raw Transcript
          </button>
        </div>
      )}

      {/* Brief view */}
      {activeTab === "brief" && hasBrief && (
        <div className="space-y-3">
          {briefSections.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {section.heading}
                </h4>
              )}
              {section.body && (
                <div className="rounded-lg bg-white p-3 ring-1 ring-gray-200">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                    {section.body}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Transcript / notes view */}
      {(activeTab === "transcript" || (!hasBrief && !hasTranscript)) && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500">
              {hasBrief ? "Raw Transcript" : "Meeting Notes"}
            </h4>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-md bg-[#4d4bf7] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[#3d3bc7] disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={16}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#4d4bf7] focus:outline-none focus:ring-2 focus:ring-[#c9d4ff]"
              placeholder="Add meeting notes..."
            />
          ) : hasTranscript ? (
            <div className="max-h-[500px] overflow-y-auto rounded-lg bg-white p-4 ring-1 ring-gray-200">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                {meeting.summary}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg bg-white py-10 ring-1 ring-gray-200">
              <p className="text-sm text-gray-400">
                No notes yet.{" "}
                <button
                  onClick={() => setEditing(true)}
                  className="font-medium text-[#4d4bf7] hover:underline"
                >
                  Add notes
                </button>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
