"use client";

import { useState } from "react";
import {
  Search,
  Mail,
  Building2,
  Clock,
  Activity,
  Timer,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getRelativeTime } from "@/lib/utils";
import type { CrossRoomVisitorEntry, VisitorTimeline } from "@/lib/types";

interface VisitorTableProps {
  visitors: CrossRoomVisitorEntry[];
}

/** Seconds -> "1h 3m" / "5m 12s" / "42s". */
function formatDuration(total: number): string {
  const s = Math.max(0, Math.round(total));
  if (s === 0) return "0s";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** Human-readable description for a timeline event. */
function describeEvent(
  type: string,
  data: Record<string, unknown> | null
): string {
  const tab = typeof data?.tab === "string" ? data.tab : null;
  switch (type) {
    case "page_view":
      return "Opened the room";
    case "tab_click":
      return tab ? `Viewed "${tab}"` : "Switched tab";
    case "sub_tab_click":
      return tab ? `Viewed "${tab}"` : "Opened a section";
    case "email_gate_submit":
      return "Entered their email";
    case "video_play":
      return "Played the product demo";
    case "link_click":
      return typeof data?.label === "string"
        ? `Clicked "${data.label}"`
        : "Clicked a link";
    default:
      return type.replace(/_/g, " ");
  }
}

export function VisitorTable({ visitors }: VisitorTableProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activity, setActivity] = useState<Record<string, VisitorTimeline>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function toggle(visitorId: string) {
    if (expanded === visitorId) {
      setExpanded(null);
      return;
    }
    setExpanded(visitorId);
    if (!activity[visitorId]) {
      setLoadingId(visitorId);
      try {
        const res = await fetch(
          `/api/admin/analytics/visitors/${visitorId}`
        );
        if (res.ok) {
          const data: VisitorTimeline = await res.json();
          setActivity((prev) => ({ ...prev, [visitorId]: data }));
        }
      } catch {
        /* best-effort */
      } finally {
        setLoadingId(null);
      }
    }
  }

  const filtered = visitors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.email.toLowerCase().includes(q) ||
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.company && v.company.toLowerCase().includes(q)) ||
      v.rooms_visited.some((r) => r.company_name.toLowerCase().includes(q))
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Visitor Activity
          </h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search visitors..."
              className="h-8 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-[#4d4bf7] focus:ring-1 focus:ring-[#4d4bf7]/20"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-gray-400">
              {search ? "No visitors match your search" : "No visitor data yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  <th className="w-8 px-2 py-2.5" />
                  <th className="px-5 py-2.5">Visitor</th>
                  <th className="px-5 py-2.5">Company</th>
                  <th className="px-5 py-2.5">Rooms Visited</th>
                  <th className="px-5 py-2.5 text-center">Time on Room</th>
                  <th className="px-5 py-2.5 text-center">Events</th>
                  <th className="px-5 py-2.5 text-right">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((visitor) => {
                  const isOpen = expanded === visitor.visitor_id;
                  const detail = activity[visitor.visitor_id];
                  return (
                    <FragmentRows
                      key={visitor.visitor_id}
                      visitor={visitor}
                      isOpen={isOpen}
                      loading={loadingId === visitor.visitor_id}
                      detail={detail}
                      onToggle={() => toggle(visitor.visitor_id)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FragmentRows({
  visitor,
  isOpen,
  loading,
  detail,
  onToggle,
}: {
  visitor: CrossRoomVisitorEntry;
  isOpen: boolean;
  loading: boolean;
  detail: VisitorTimeline | undefined;
  onToggle: () => void;
}) {
  // Per-room active time, computed from the loaded timeline.
  const perRoom = new Map<string, number>();
  const timeline = (detail?.events ?? []).filter(
    (e) => e.event_type !== "time_on_tab"
  );
  for (const e of detail?.events ?? []) {
    if (e.event_type === "time_on_tab") {
      const secs = Number((e.event_data as { seconds?: number })?.seconds ?? 0);
      perRoom.set(e.room_name, (perRoom.get(e.room_name) ?? 0) + secs);
    }
  }

  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50/50 ${
          isOpen ? "bg-gray-50/60" : ""
        }`}
      >
        <td className="px-2 py-3 text-gray-400">
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              isOpen ? "rotate-90 text-gray-600" : ""
            }`}
          />
        </td>
        <td className="px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e6ecff]">
              <Mail className="h-3 w-3 text-[#4d4bf7]" />
            </div>
            <div className="min-w-0">
              {visitor.name ? (
                <>
                  <p className="truncate text-sm font-medium text-gray-900">
                    {visitor.name}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {visitor.email}
                  </p>
                </>
              ) : (
                <p className="truncate text-sm font-medium text-gray-900">
                  {visitor.email}
                </p>
              )}
            </div>
          </div>
        </td>
        <td className="px-5 py-3">
          {visitor.company ? (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-700">{visitor.company}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </td>
        <td className="px-5 py-3">
          <div className="flex flex-wrap gap-1">
            {visitor.rooms_visited.map((room) => (
              <span
                key={room.room_id}
                className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
              >
                {room.company_name}
              </span>
            ))}
          </div>
        </td>
        <td className="px-5 py-3 text-center">
          <div className="inline-flex items-center gap-1 rounded-full bg-[#e6ecff] px-2 py-0.5">
            <Timer className="h-3 w-3 text-[#4d4bf7]" />
            <span className="text-xs font-semibold text-[#4d4bf7]">
              {formatDuration(visitor.active_seconds)}
            </span>
          </div>
        </td>
        <td className="px-5 py-3 text-center">
          <div className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5">
            <Activity className="h-3 w-3 text-green-600" />
            <span className="text-xs font-semibold text-green-700">
              {visitor.total_events}
            </span>
          </div>
        </td>
        <td className="px-5 py-3 text-right">
          <div className="inline-flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {getRelativeTime(visitor.last_active)}
          </div>
        </td>
      </tr>

      {isOpen && (
        <tr className="border-b border-gray-100 bg-gray-50/40">
          <td colSpan={7} className="px-5 py-4">
            {loading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading activity...
              </div>
            ) : !detail || timeline.length === 0 ? (
              <p className="py-3 text-sm text-gray-400">
                No detailed activity recorded yet.
              </p>
            ) : (
              <div className="flex flex-col gap-4 lg:flex-row">
                {/* Active time breakdown */}
                <div className="shrink-0 lg:w-56">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Engaged time
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(detail.total_active_seconds)}
                  </p>
                  <p className="mb-3 text-[11px] text-gray-400">
                    active time, idle excluded
                  </p>
                  <div className="space-y-1.5">
                    {Array.from(perRoom.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([room, secs]) => (
                        <div
                          key={room}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="truncate text-gray-600">{room}</span>
                          <span className="shrink-0 font-medium text-gray-900">
                            {formatDuration(secs)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Event timeline */}
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Activity timeline
                  </p>
                  <div className="max-h-72 space-y-1 overflow-y-auto pr-2">
                    {timeline.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center gap-2 rounded-lg bg-white px-3 py-2"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4d4bf7]" />
                        <span className="text-sm text-gray-700">
                          {describeEvent(e.event_type, e.event_data)}
                        </span>
                        <span className="ml-1 inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                          {e.room_name}
                        </span>
                        <span className="ml-auto shrink-0 text-[11px] text-gray-400">
                          {getRelativeTime(e.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
