"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Building2,
  Users,
  Sparkles,
  CheckCircle2,
  Loader2,
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

  // Normalize company names for matching
  const existingSet = new Set(
    existingCompanies.map((c) => c.toLowerCase().trim())
  );

  useEffect(() => {
    async function fetchMeetings() {
      try {
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
    fetchMeetings();
  }, []);

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

      // Redirect to the new room's editor
      router.push(`/admin/rooms/${data.room.id}`);
      router.refresh();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to generate room"
      );
      setGeneratingId(null);
    }
  }

  function hasExistingRoom(meeting: GranolaMeetingCache): boolean {
    if (!meeting.company_name) return false;
    return existingSet.has(meeting.company_name.toLowerCase().trim());
  }

  if (loading) {
    return (
      <div className="mt-10">
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
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">
          Granola Meetings
        </h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (meetings.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Granola Meetings
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Generate rooms directly from your recent demo calls.
          </p>
        </div>
        <span className="rounded-full bg-[#e6ecff] px-3 py-1 text-xs font-medium text-[#4d4bf7]">
          {meetings.length} meetings
        </span>
      </div>

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
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {meetings.map((meeting) => {
              const alreadyExists = hasExistingRoom(meeting);
              const isGenerating = generatingId === meeting.id;
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
                  className="transition-colors hover:bg-gray-50"
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
                      <span className="text-sm text-gray-400">—</span>
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
                  <td className="px-6 py-4 text-right">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
