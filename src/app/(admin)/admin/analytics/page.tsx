"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sidebar } from "@/components/admin/sidebar";
import { KpiCards } from "@/components/admin/analytics/kpi-cards";
import { RoomFunnelCard } from "@/components/admin/analytics/room-funnel-card";
import { DailyActivityChart } from "@/components/admin/analytics/daily-activity-chart";
import { VisitorTable } from "@/components/admin/analytics/visitor-table";
import type { CrossRoomAnalytics, RoomAnalyticsCard } from "@/lib/types";

type SortMode = "most_active" | "least_active" | "newest";

export default function AnalyticsDashboardPage() {
  const [analytics, setAnalytics] = useState<CrossRoomAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);
  const [sort, setSort] = useState<SortMode>("most_active");
  const [roomSearch, setRoomSearch] = useState("");

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
    let rooms = [...analytics.rooms];

    // Filter by search
    if (roomSearch) {
      const q = roomSearch.toLowerCase();
      rooms = rooms.filter(
        (r) =>
          r.company_name.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sort) {
      case "most_active":
        return rooms.sort((a, b) => b.page_views - a.page_views);
      case "least_active":
        return rooms.sort((a, b) => a.page_views - b.page_views);
      case "newest":
        return rooms; // Already sorted by created_at desc from API
    }
  }, [analytics, sort, roomSearch]);

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          {loading ? (
            <LoadingSkeleton />
          ) : error || !analytics ? (
            <p className="text-sm text-red-600">{error || "No data"}</p>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Analytics
                  </h1>
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
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="shrink-0 text-sm font-semibold text-gray-900">
                    Room Engagement
                  </h2>

                  <div className="flex items-center gap-3">
                    {/* Search bar */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={roomSearch}
                        onChange={(e) => setRoomSearch(e.target.value)}
                        placeholder="Search rooms..."
                        className="h-8 w-48 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-[#4d4bf7] focus:ring-1 focus:ring-[#4d4bf7]/20"
                      />
                    </div>

                    {/* Sort controls */}
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
                </div>

                {sortedRooms.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <p className="text-sm text-gray-400">
                        {roomSearch
                          ? "No rooms match your search"
                          : "No rooms created yet"}
                      </p>
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
              <div className="mb-8">
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

              {/* Visitor activity table */}
              <VisitorTable
                visitors={analytics.recent_visitors ?? []}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}

function LoadingSkeleton() {
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
