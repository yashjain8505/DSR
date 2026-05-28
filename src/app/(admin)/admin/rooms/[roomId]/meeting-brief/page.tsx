"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Download, Calendar, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import type { MeetingBrief, GranolaMeetingCache } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function MeetingBriefPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Granola import state
  const [granolaDlgOpen, setGranolaDlgOpen] = useState(false);
  const [granolaMeetings, setGranolaMeetings] = useState<
    GranolaMeetingCache[]
  >([]);
  const [granolaLoading, setGranolaLoading] = useState(false);
  const [granolaError, setGranolaError] = useState("");

  useEffect(() => {
    async function fetchBrief() {
      try {
        const res = await fetch(`/api/rooms/${roomId}/meeting-brief`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const brief: MeetingBrief = data.meeting_brief;
        setContent(brief.content);
      } catch {
        setError("Failed to load meeting brief");
      } finally {
        setLoading(false);
      }
    }
    fetchBrief();
  }, [roomId]);

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch(`/api/rooms/${roomId}/meeting-brief`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
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
        err instanceof Error ? err.message : "Failed to load Granola meetings"
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
    // Build markdown content from meeting data
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

    const fullContent = header + dateLine + participantsLine + meeting.summary;
    setContent(fullContent);
    setGranolaDlgOpen(false);
    setSuccess("Meeting notes imported from Granola");
    setTimeout(() => setSuccess(""), 3000);
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
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenGranola}
          >
            <Download className="h-4 w-4" />
            Import from Granola
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

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {showPreview ? (
          <div className="min-h-[300px]">
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-sm text-gray-400">Nothing to preview</p>
            )}
          </div>
        ) : (
          <Textarea
            label="Content (Markdown supported)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            placeholder="Write the meeting brief here... Markdown is supported."
          />
        )}
      </div>

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
