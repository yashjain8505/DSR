"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { KpiCards } from "@/components/admin/analytics/kpi-cards";
import { RoomFunnelCard } from "@/components/admin/analytics/room-funnel-card";
import { DailyActivityChart } from "@/components/admin/analytics/daily-activity-chart";
import type { CrossRoomAnalytics, RoomAnalyticsCard } from "@/lib/types";

type SortMode = "most_active" | "least_active" | "newest";

export default function AnalyticsDashboardPage() {
  const [analytics, setAnalytics] = useState<CrossRoomAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);
  const [sort, setSort] = useState<SortMode>("most_active");

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/analytics?days=${days}`);
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
  }, [days]);

  const sortedRooms = useMemo(() => {
    if (!analytics) return [];
    const rooms = [...analytics.rooms];
    switch (sort) {
      case "most_active":
        return rooms.sort((a, b) => b.page_views - a.page_views);
      case "least_active":
        return rooms.sort((a, b) => a.page_views - b.page_views);
      case "newest":
        return rooms; // Already sorted by created_at desc from API
    }
  }, [analytics, sort]);

  if (loading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-32 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (error || !analytics) {
    return <p className="text-sm text-red-600">{error || "No data"}</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Activity across all rooms
          </p>
        </div>
        <div className="flex gap-1.5">
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

      {/* KPI Cards */}
      <div className="mb-8">
        <KpiCards
          totalPageViews={analytics.kpis.total_page_views}
          totalUniqueVisitors={analytics.kpis.total_unique_visitors}
          activeRooms={analytics.kpis.active_rooms}
          emailConversionRate={analytics.kpis.email_conversion_rate}
        />
      </div>

      {/* Room funnel cards */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Room Engagement
          </h2>
          <div className="flex gap-1">
            {(
              [
                { key: "most_active", label: "Most Active" },
                { key: "least_active", label: "Least Active" },
                { key: "newest", label: "Newest" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSort(opt.key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  sort === opt.key
                    ? "bg-[#e6ecff] text-[#4d4bf7]"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {sortedRooms.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-sm text-gray-400">No rooms created yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedRooms.map((room: RoomAnalyticsCard) => (
              <RoomFunnelCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>

      {/* Daily activity chart */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">
            Daily Activity
          </h2>
        </CardHeader>
        <CardContent>
          <DailyActivityChart data={analytics.daily_activity} />
        </CardContent>
      </Card>
    </div>
  );
}
