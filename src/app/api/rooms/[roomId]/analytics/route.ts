import { requireAdmin } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RoomAnalyticsSummary } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { roomId } = await params;
    const days = parseInt(
      request.nextUrl.searchParams.get("days") ?? "30",
      10
    );
    const since = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    const admin = createAdminClient();

    // Run all analytics queries in parallel
    const [
      pageViewsResult,
      uniqueVisitorsResult,
      tabClicksResult,
      recentVisitorsResult,
    ] = await Promise.all([
      // Total page views
      admin
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("room_id", roomId)
        .eq("event_type", "page_view")
        .gte("created_at", since),

      // Unique visitors (distinct visitor_id)
      admin
        .from("analytics_events")
        .select("visitor_id")
        .eq("room_id", roomId)
        .not("visitor_id", "is", null)
        .gte("created_at", since),

      // Tab click breakdown
      admin
        .from("analytics_events")
        .select("event_data")
        .eq("room_id", roomId)
        .eq("event_type", "tab_click")
        .gte("created_at", since),

      // Recent visitors with last visit time and event count
      admin
        .from("room_visits")
        .select(
          "visitor_id, last_visited_at, visitors!inner(id, email, name, company, created_at)"
        )
        .eq("room_id", roomId)
        .order("last_visited_at", { ascending: false })
        .limit(20),
    ]);

    // Compute unique visitor count
    const uniqueVisitorIds = new Set(
      (uniqueVisitorsResult.data ?? []).map((row) => row.visitor_id)
    );

    // Compute tab click breakdown
    const tabClicks: Record<string, number> = {};
    for (const row of tabClicksResult.data ?? []) {
      const tab =
        (row.event_data as Record<string, unknown> | null)?.tab as
          | string
          | undefined;
      if (tab) {
        tabClicks[tab] = (tabClicks[tab] ?? 0) + 1;
      }
    }

    // Get event counts per visitor for recent visitors
    const visitorIds = (recentVisitorsResult.data ?? []).map(
      (rv) => rv.visitor_id
    );

    let eventCountMap: Record<string, number> = {};
    if (visitorIds.length > 0) {
      const { data: eventCounts } = await admin
        .from("analytics_events")
        .select("visitor_id")
        .eq("room_id", roomId)
        .in("visitor_id", visitorIds);

      for (const row of eventCounts ?? []) {
        if (row.visitor_id) {
          eventCountMap[row.visitor_id] =
            (eventCountMap[row.visitor_id] ?? 0) + 1;
        }
      }
    }

    const recentVisitors = (recentVisitorsResult.data ?? []).map((rv) => {
      const visitor = rv.visitors as unknown as {
        id: string;
        email: string;
        name: string | null;
        company: string | null;
        created_at: string;
      };
      return {
        visitor,
        last_visited_at: rv.last_visited_at,
        total_events: eventCountMap[rv.visitor_id] ?? 0,
      };
    });

    const summary: RoomAnalyticsSummary = {
      total_views: pageViewsResult.count ?? 0,
      unique_visitors: uniqueVisitorIds.size,
      tab_clicks: tabClicks,
      recent_visitors: recentVisitors,
    };

    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
