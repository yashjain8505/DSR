"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { GranolaMeetingCache } from "@/lib/types";

interface GranolaMeetingsPanelProps {
  /** Existing room company names — used to mark meetings that already have rooms */
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

  // Normalize company names for matching (initial + newly created)
  const existingSet = new Set(
    [...existingCompanies, ...createdCompanies].map((c) => c.toLowerCase().trim())
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

      // Stay on meetings page — update "Room exists" badge instantly
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
      if (!res.ok) throw new Error(data.error);
      setSyncMessage(`Synced ${data.synced} meetings`);
      // Refresh the list
      await fetchMeetings();
    } catch (err) {
      setSyncMessage(
        err instanceof Error ? err.message : "Sync failed"
      );
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(""), 4000);
    }
  }

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
            Generate rooms directly from your recent demo calls.
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
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Meeting
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Participants
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMeetings.map((meeting) => {
                const alreadyExists = hasExistingRoom(meeting);
                const isGenerating = generatingId === meeting.id;
                const isDeleting = deletingId === meeting.id;
                const hasSummary = !!meeting.summary;

                // Count prospect participants (non-Linkrunner)
                const prospectCount = meeting.participants.filter(
                  (p) =>
                    !p.is_creator &&
                    !p.email?.endsWith("@linkrunner.io") &&
                    p.name !== "Shreyans" &&
                    p.name !== "Lakshith"
                ).length;

                return (
                  <tr
                    key={meeting.id}
                    className={`transition-colors hover:bg-gray-50 ${isDeleting ? "opacity-50" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {meeting.title}
                      </p>
                      {!hasSummary && (
                        <p className="mt-0.5 text-xs text-amber-500">
                          No summary available
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {meeting.company_name ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          {meeting.company_name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(meeting.meeting_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                        <Users className="h-3.5 w-3.5" />
                        {prospectCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
