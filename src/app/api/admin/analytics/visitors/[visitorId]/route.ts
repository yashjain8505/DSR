import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VisitorTimeline, VisitorTimelineEvent } from "@/lib/types";

/**
 * GET /api/admin/analytics/visitors/[visitorId]
 *
 * Full cross-room activity timeline for one visitor: every event across every
 * room they touched (newest first), plus their total engaged (active) time.
 * Powers the expandable drilldown on the admin analytics visitor table.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ visitorId: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { visitorId } = await params;
    const admin = createAdminClient();

    const [visitorResult, eventsResult, roomsResult] = await Promise.all([
      admin
        .from("visitors")
        .select("id, email, name, company, created_at")
        .eq("id", visitorId)
        .single(),
      admin
        .from("analytics_events")
        .select("id, room_id, event_type, event_data, created_at")
        .eq("visitor_id", visitorId)
        .order("created_at", { ascending: false })
        .limit(1000),
      admin.from("rooms").select("id, company_name"),
    ]);

    if (visitorResult.error || !visitorResult.data) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    const roomName = new Map(
      (roomsResult.data ?? []).map((r) => [r.id, r.company_name])
    );

    let totalActiveSeconds = 0;
    const events: VisitorTimelineEvent[] = (eventsResult.data ?? []).map(
      (ev) => {
        if (ev.event_type === "time_on_tab") {
          totalActiveSeconds += Number(
            (ev.event_data as { seconds?: number } | null)?.seconds ?? 0
          );
        }
        return {
          id: ev.id,
          room_id: ev.room_id,
          room_name: roomName.get(ev.room_id) ?? "Unknown",
          event_type: ev.event_type,
          event_data: ev.event_data as Record<string, unknown> | null,
          created_at: ev.created_at,
        };
      }
    );

    const response: VisitorTimeline = {
      visitor: visitorResult.data,
      total_active_seconds: totalActiveSeconds,
      events,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
