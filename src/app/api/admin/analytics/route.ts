import { requireAdmin } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CrossRoomAnalytics,
  RoomAnalyticsCard,
  DailyActivity,
  CrossRoomVisitorEntry,
} from "@/lib/types";

/**
 * GET /api/admin/analytics?days=30
 *
 * Aggregates analytics events across all rooms for the admin dashboard.
 * Returns KPI stats, per-room funnel cards, and daily activity breakdown.
 */
export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

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
    const [
      roomsResult,
      eventsResult,
      visitsResult,
      visitorsResult,
      internalResult,
    ] = await Promise.all([
      admin
        .from("rooms")
        .select("id, slug, company_name, logo_url, created_at")
        .order("created_at", { ascending: false }),

      admin
        .from("analytics_events")
        .select("room_id, visitor_id, event_type, event_data, created_at")
        .gte("created_at", since),

      admin
        .from("room_visits")
        .select(
          "room_id, visitor_id, last_visited_at, visitors!inner(id, email, name, company)"
        )
        .order("last_visited_at", { ascending: false }),

      admin
        .from("visitors")
        .select("id, email, name, company, created_at")
        .order("created_at", { ascending: false })
        .limit(200),

      // Internal testing accounts — excluded from every metric below.
      admin.from("visitors").select("id").ilike("email", "%@linkrunner.io"),
    ]);

    const rooms = roomsResult.data ?? [];
    const visits = visitsResult.data ?? [];
    const visitors = visitorsResult.data ?? [];

    // Exclude @linkrunner.io visitors (internal testing) from all analytics.
    const internalIds = new Set(
      (internalResult.data ?? []).map((v) => v.id)
    );
    const events = (eventsResult.data ?? []).filter(
      (ev) => !(ev.visitor_id && internalIds.has(ev.visitor_id))
    );

    // --- Single-pass event aggregation ---

    const roomPageViews = new Map<string, number>();
    const roomTabClicks = new Map<string, number>();
    const roomEmailSubmits = new Map<string, number>();
    const roomVideoPlays = new Map<string, number>();
    const roomUniqueVisitors = new Map<string, Set<string>>();
    const roomDailyPageViews = new Map<string, Map<string, number>>();
    // Active engaged seconds per visitor, summed from accurate time deltas.
    const visitorActiveSeconds = new Map<string, number>();
    // Legacy fallback: longest single (capped) session per room, per visitor.
    const visitorRoomLegacyMax = new Map<string, Map<string, number>>();
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

        // Engaged time. v >= 2 = accurate per-section tracker (summed). Legacy
        // events feed a capped per-room-max estimate used only when there is no
        // accurate data for the visitor.
        if (ev.event_type === "time_on_tab") {
          const v = Number((ev.event_data as { v?: number } | null)?.v ?? 0);
          const secs = Number(
            (ev.event_data as { seconds?: number } | null)?.seconds ?? 0
          );
          if (v >= 2) {
            if (secs > 0) {
              visitorActiveSeconds.set(
                ev.visitor_id,
                (visitorActiveSeconds.get(ev.visitor_id) ?? 0) + secs
              );
            }
          } else if (secs > 0) {
            const capped = Math.min(900, secs);
            const rm =
              visitorRoomLegacyMax.get(ev.visitor_id) ??
              new Map<string, number>();
            rm.set(rid, Math.max(rm.get(rid) ?? 0, capped));
            visitorRoomLegacyMax.set(ev.visitor_id, rm);
          }
        }
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
        sparkline_dates: sparklineDates,
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

    // --- Build recent visitors with room context ---

    // Map room_id → company_name for quick lookup
    const roomNameMap = new Map(rooms.map((r) => [r.id, r.company_name]));

    // Map visitor_id → visitor info
    const visitorMap = new Map(
      visitors.map((v) => [v.id, v])
    );

    // Group visits by visitor
    const visitorRoomMap = new Map<
      string,
      { rooms: { room_id: string; company_name: string }[]; lastActive: string }
    >();
    for (const v of visits) {
      const vid = v.visitor_id;
      if (internalIds.has(vid)) continue; // skip @linkrunner.io
      const existing = visitorRoomMap.get(vid);
      const roomEntry = {
        room_id: v.room_id,
        company_name: roomNameMap.get(v.room_id) ?? "Unknown",
      };
      if (existing) {
        // Add room if not already listed
        if (!existing.rooms.some((r) => r.room_id === v.room_id)) {
          existing.rooms.push(roomEntry);
        }
        if (v.last_visited_at > existing.lastActive) {
          existing.lastActive = v.last_visited_at;
        }
      } else {
        visitorRoomMap.set(vid, {
          rooms: [roomEntry],
          lastActive: v.last_visited_at,
        });
      }
    }

    // Count events per visitor
    const visitorEventCount = new Map<string, number>();
    for (const ev of events) {
      if (ev.visitor_id) {
        visitorEventCount.set(
          ev.visitor_id,
          (visitorEventCount.get(ev.visitor_id) ?? 0) + 1
        );
      }
    }

    // Assemble visitor entries
    const recentVisitors: CrossRoomVisitorEntry[] = [];
    for (const [vid, data] of visitorRoomMap) {
      const visitor = visitorMap.get(vid);
      if (!visitor) continue;

      // Prefer accurate time; fall back to the capped legacy estimate.
      const reliable = visitorActiveSeconds.get(vid) ?? 0;
      let activeSeconds = reliable;
      let activeIsEstimate = false;
      if (reliable === 0) {
        const rm = visitorRoomLegacyMax.get(vid);
        if (rm) {
          let s = 0;
          for (const v of rm.values()) s += v;
          if (s > 0) {
            activeSeconds = s;
            activeIsEstimate = true;
          }
        }
      }

      recentVisitors.push({
        visitor_id: vid,
        email: visitor.email,
        name: visitor.name,
        company: visitor.company,
        rooms_visited: data.rooms,
        total_events: visitorEventCount.get(vid) ?? 0,
        active_seconds: activeSeconds,
        active_is_estimate: activeIsEstimate,
        last_active: data.lastActive,
      });
    }
    // Sort by last active desc
    recentVisitors.sort(
      (a, b) =>
        new Date(b.last_active).getTime() - new Date(a.last_active).getTime()
    );

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
      recent_visitors: recentVisitors,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
