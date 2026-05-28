"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Eye, Users, MousePointerClick, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDateTime, getRelativeTime } from "@/lib/utils";
import { MAIN_TAB_LABELS } from "@/lib/constants";
import type { RoomAnalyticsSummary } from "@/lib/types";

export default function AnalyticsPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const [analytics, setAnalytics] = useState<RoomAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

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

      {/* Recent visitors */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">
            Recent Visitors
          </h2>
        </CardHeader>
        <CardContent>
          {analytics.recent_visitors.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              No visitors yet
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {analytics.recent_visitors.map((entry) => (
                <div
                  key={entry.visitor.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="min-w-0 flex-1">
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
