import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VisitorEventEntry } from "@/lib/types";

/**
 * GET /api/rooms/[roomId]/analytics/visitors/[visitorId]
 * Full activity timeline for one visitor in one room — every tracked event
 * (page views, tab/sub-tab clicks, link clicks, video plays, time on page),
 * newest first.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string; visitorId: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { roomId, visitorId } = await params;
    const admin = createAdminClient();

    const [visitorResult, eventsResult] = await Promise.all([
      admin
        .from("visitors")
        .select("id, email, name, company")
        .eq("id", visitorId)
        .single(),
      admin
        .from("analytics_events")
        .select("id, event_type, event_data, created_at")
        .eq("room_id", roomId)
        .eq("visitor_id", visitorId)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    if (eventsResult.error) {
      return NextResponse.json(
        { error: eventsResult.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      visitor: visitorResult.data ?? null,
      events: (eventsResult.data ?? []) as VisitorEventEntry[],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
