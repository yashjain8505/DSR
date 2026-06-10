"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Eye,
  Users,
  MousePointerClick,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDateTime, getRelativeTime } from "@/lib/utils";
import { MAIN_TAB_LABELS } from "@/lib/constants";
import type { RoomAnalyticsSummary, VisitorEventEntry } from "@/lib/types";

/** Human-readable label for a tab / sub-tab key in event data. */
function tabLabel(key: unknown): string {
  if (typeof key !== "string") return "unknown";
  return (MAIN_TAB_LABELS as Record<string, string>)[key] ?? key;
}

/** One-line description of a tracked event for the activity timeline. */
function describeEvent(e: VisitorEventEntry): string {
  const d = (e.event_data ?? {}) as Record<string, unknown>;
  switch (e.event_type) {
    case "page_view":
      return "Opened the room";
    case "email_gate_submit":
      return "Signed in through the email gate";
    case "tab_click":
      return `Viewed tab: ${tabLabel(d.tab)}`;
    case "sub_tab_click":
      return `Viewed section: ${tabLabel(d.sub_tab_key)}`;
    case "video_play":
      return "Played the demo video";
    case "link_click":
      return typeof d.url === "string"
        ? `Clicked link: ${d.url}`
        : "Clicked a link";
    case "time_on_tab": {
      const s = typeof d.seconds === "number" ? d.seconds : null;
      if (s === null) return "Session ended";
      const m = Math.floor(s / 60);
      return m > 0
        ? `Spent ${m}m ${s % 60}s in the room`
        : `Spent ${s}s in the room`;
    }
    default:
      return e.event_type;
  }
}

export default function AnalyticsPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const [analytics, setAnalytics] = useState<RoomAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);
  const [expandedVisitor, setExpandedVisitor] = useState<string | null>(null);
  const [timelines, setTimelines] = useState<
    Record<string, VisitorEventEntry[] | "loading" | "error">
  >({});

  async function toggleVisitor(visitorId: string) {
    if (expandedVisitor === visitorId) {
      setExpandedVisitor(null);
      return;
    }
    setExpandedVisitor(visitorId);

    if (timelines[visitorId] && timelines[visitorId] !== "error") return;

    setTimelines((prev) => ({ ...prev, [visitorId]: "loading" }));
    try {
      const res = await fetch(
        `/api/rooms/${roomId}/analytics/visitors/${visitorId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTimelines((prev) => ({ ...prev, [visitorId]: data.events }));
    } catch {
      setTimelines((prev) => ({ ...prev, [visitorId]: "error" }));
    }
  }

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/rooms/${roomId}/analytics?days=${days}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAnalytics(data);
      } catch {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [roomId, days]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return <p className="text-sm text-red-600">{error || "No data"}</p>;
  }

  const tabClickEntries = Object.entries(analytics.tab_clicks).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                days === d
                  ? "bg-[#e6ecff] text-[#4d4bf7]"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6ecff]">
              <Eye className="h-5 w-5 text-[#4d4bf7]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.total_views}
              </p>
              <p className="text-sm text-gray-500">Page Views</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.unique_visitors}
              </p>
              <p className="text-sm text-gray-500">Unique Visitors</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <MousePointerClick className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {tabClickEntries.reduce((sum, [, v]) => sum + v, 0)}
              </p>
              <p className="text-sm text-gray-500">Tab Clicks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab click breakdown */}
      {tabClickEntries.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">
              Tab Click Breakdown
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tabClickEntries.map(([tab, count]) => {
                const maxCount = tabClickEntries[0][1];
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const label =
                  MAIN_TAB_LABELS[tab as keyof typeof MAIN_TAB_LABELS] ?? tab;

                return (
                  <div key={tab}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-700">{label}</span>
                      <span className="font-medium text-gray-900">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-[#4d4bf7] transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent visitors with per-visitor activity timelines */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Recent Visitors
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Click a visitor to see everything they did in the room.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {analytics.recent_visitors.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              No visitors yet
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {analytics.recent_visitors.map((entry) => {
                const isExpanded = expandedVisitor === entry.visitor.id;
                const timeline = timelines[entry.visitor.id];

                return (
                  <div key={entry.visitor.id}>
                    <button
                      type="button"
                      onClick={() => toggleVisitor(entry.visitor.id)}
                      className="flex w-full items-center justify-between py-3 text-left transition-colors hover:bg-gray-50/50"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {entry.visitor.email}
                          </p>
                          {(entry.visitor.name || entry.visitor.company) && (
                            <p className="text-xs text-gray-500">
                              {[entry.visitor.name, entry.visitor.company]
                                .filter(Boolean)
                                .join(" - ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-4 text-right">
                        <div>
                          <p className="text-xs text-gray-500">
                            {entry.total_events} events
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span title={formatDateTime(entry.last_visited_at)}>
                            {getRelativeTime(entry.last_visited_at)}
                          </span>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mb-3 ml-6 rounded-lg bg-gray-50 px-4 py-3">
                        {timeline === "loading" || timeline === undefined ? (
                          <p className="py-2 text-xs text-gray-400">
                            Loading activity…
                          </p>
                        ) : timeline === "error" ? (
                          <p className="py-2 text-xs text-red-500">
                            Failed to load activity
                          </p>
                        ) : timeline.length === 0 ? (
                          <p className="py-2 text-xs text-gray-400">
                            No tracked activity for this visitor yet.
                          </p>
                        ) : (
                          <ol className="space-y-2">
                            {timeline.map((event) => (
                              <li
                                key={event.id}
                                className="flex items-baseline justify-between gap-4 text-sm"
                              >
                                <span className="flex min-w-0 items-baseline gap-2">
                                  <span
                                    aria-hidden="true"
                                    className="h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full bg-[#4d4bf7]"
                                  />
                                  <span className="truncate text-gray-700">
                                    {describeEvent(event)}
                                  </span>
                                </span>
                                <span className="shrink-0 whitespace-nowrap text-xs text-gray-400">
                                  {formatDateTime(event.created_at)}
                                </span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
