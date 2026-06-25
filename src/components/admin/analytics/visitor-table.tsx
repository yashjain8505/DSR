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
import { formatDuration } from "@/lib/analytics-format";
import { VisitorActivityDetail } from "@/components/admin/analytics/visitor-activity-detail";
import type { CrossRoomVisitorEntry, VisitorTimeline } from "@/lib/types";

interface VisitorTableProps {
  visitors: CrossRoomVisitorEntry[];
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
          <div
            className="inline-flex items-center gap-1 rounded-full bg-[#e6ecff] px-2 py-0.5"
            title={
              visitor.active_is_estimate
                ? "Approximate, estimated from pre-upgrade data"
                : undefined
            }
          >
            <Timer className="h-3 w-3 text-[#4d4bf7]" />
            <span className="text-xs font-semibold text-[#4d4bf7]">
              {visitor.active_is_estimate ? "~" : ""}
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
            ) : !detail || detail.events.length === 0 ? (
              <p className="py-3 text-sm text-gray-400">
                No detailed activity recorded yet.
              </p>
            ) : (
              <VisitorActivityDetail events={detail.events} includeRoom />
            )}
          </td>
        </tr>
      )}
    </>
  );
}
