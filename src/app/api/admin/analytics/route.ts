import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CrossRoomAnalytics,
  RoomAnalyticsCard,
  DailyActivity,
} from "@/lib/types";

/**
 * GET /api/admin/analytics?days=30
 *
 * Aggregates analytics events across all rooms for the admin dashboard.
 * Returns KPI stats, per-room funnel cards, and daily activity breakdown.
 */
export async function GET(request: NextRequest) {
  try {
    const days = parseInt(
      request.nextUrl.searchParams.get("days") ?? "30",
      10
    );
    const since = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    const admin = createAdminClient();

    // Run all queries in parallel
    const [roomsResult, eventsResult, visitsResult] = await Promise.all([
      admin
        .from("rooms")
        .select("id, slug, company_name, logo_url, created_at")
        .order("created_at", { ascending: false }),

      admin
        .from("analytics_events")
        .select("room_id, visitor_id, event_type, created_at")
        .gte("created_at", since),

      admin
        .from("room_visits")
        .select("room_id, visitor_id, last_visited_at")
        .order("last_visited_at", { ascending: false }),
    ]);

    const rooms = roomsResult.data ?? [];
    const events = eventsResult.data ?? [];
    const visits = visitsResult.data ?? [];

    // --- Single-pass event aggregation ---

    const roomPageViews = new Map<string, number>();
    const roomTabClicks = new Map<string, number>();
    const roomEmailSubmits = new Map<string, number>();
    const roomVideoPlays = new Map<string, number>();
    const roomUniqueVisitors = new Map<string, Set<string>>();
    const roomDailyPageViews = new Map<string, Map<string, number>>();
    const dailyBuckets = new Map<
      string,
      Record<string, number>
    >();
    const allUniqueVisitors = new Set<string>();

    for (const ev of events) {
      const rid = ev.room_id;
      const dateKey = ev.created_at.slice(0, 10); // YYYY-MM-DD

      // Per-type counts
      switch (ev.event_type) {
        case "page_view":
          roomPageViews.set(rid, (roomPageViews.get(rid) ?? 0) + 1);
          break;
        case "tab_click":
        case "sub_tab_click":
          roomTabClicks.set(rid, (roomTabClicks.get(rid) ?? 0) + 1);
          break;
        case "email_gate_submit":
          roomEmailSubmits.set(rid, (roomEmailSubmits.get(rid) ?? 0) + 1);
          break;
        case "video_play":
          roomVideoPlays.set(rid, (roomVideoPlays.get(rid) ?? 0) + 1);
          break;
      }

      // Unique visitors per room + global
      if (ev.visitor_id) {
        const visSet =
          roomUniqueVisitors.get(rid) ?? new Set<string>();
        visSet.add(ev.visitor_id);
        roomUniqueVisitors.set(rid, visSet);
        allUniqueVisitors.add(ev.visitor_id);
      }

      // Daily page views per room (for sparklines)
      if (ev.event_type === "page_view") {
        const dayMap =
          roomDailyPageViews.get(rid) ?? new Map<string, number>();
        dayMap.set(dateKey, (dayMap.get(dateKey) ?? 0) + 1);
        roomDailyPageViews.set(rid, dayMap);
      }

      // Daily activity (all event types)
      if (!dailyBuckets.has(dateKey)) {
        dailyBuckets.set(dateKey, {
          page_view: 0,
          tab_click: 0,
          email_gate_submit: 0,
          video_play: 0,
          link_click: 0,
        });
      }
      const bucket = dailyBuckets.get(dateKey)!;
      const evType = ev.event_type;
      if (evType in bucket) {
        bucket[evType] = (bucket[evType] ?? 0) + 1;
      }
    }

    // --- Build last_activity per room from visits ---

    const roomLastActivity = new Map<string, string>();
    for (const v of visits) {
      if (!roomLastActivity.has(v.room_id)) {
        roomLastActivity.set(v.room_id, v.last_visited_at);
      }
    }

    // --- Build sparkline date range ---

    const sparklineDates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      sparklineDates.push(d.toISOString().slice(0, 10));
    }

    // --- Assemble per-room cards ---

    const roomCards: RoomAnalyticsCard[] = rooms.map((room) => {
      const rid = room.id;
      const dayMap = roomDailyPageViews.get(rid);
      const sparkline = sparklineDates.map(
        (d) => dayMap?.get(d) ?? 0
      );

      return {
        id: rid,
        slug: room.slug,
        company_name: room.company_name,
        logo_url: room.logo_url,
        page_views: roomPageViews.get(rid) ?? 0,
        tab_clicks: roomTabClicks.get(rid) ?? 0,
        email_submits: roomEmailSubmits.get(rid) ?? 0,
        video_plays: roomVideoPlays.get(rid) ?? 0,
        unique_visitors: roomUniqueVisitors.get(rid)?.size ?? 0,
        sparkline,
        last_activity: roomLastActivity.get(rid) ?? null,
      };
    });

    // --- Assemble daily activity array ---

    const dailyActivity: DailyActivity[] = sparklineDates.map((date) => {
      const bucket = dailyBuckets.get(date);
      return {
        date,
        page_view: bucket?.page_view ?? 0,
        tab_click: bucket?.tab_click ?? 0,
        email_gate_submit: bucket?.email_gate_submit ?? 0,
        video_play: bucket?.video_play ?? 0,
        link_click: bucket?.link_click ?? 0,
      };
    });

    // --- KPIs ---

    const totalPageViews = Array.from(roomPageViews.values()).reduce(
      (a, b) => a + b,
      0
    );
    const totalEmailSubmits = Array.from(roomEmailSubmits.values()).reduce(
      (a, b) => a + b,
      0
    );
    const activeRooms = new Set(events.map((e) => e.room_id)).size;
    const totalUniqueVisitors = allUniqueVisitors.size;

    const response: CrossRoomAnalytics = {
      kpis: {
        total_page_views: totalPageViews,
        total_unique_visitors: totalUniqueVisitors,
        active_rooms: activeRooms,
        email_conversion_rate:
          totalUniqueVisitors > 0
            ? Math.round((totalEmailSubmits / totalUniqueVisitors) * 1000) /
              10
            : 0,
      },
      rooms: roomCards,
      daily_activity: dailyActivity,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
