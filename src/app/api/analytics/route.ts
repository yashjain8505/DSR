import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TrackEventPayload } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body: TrackEventPayload = await request.json();

    if (!body.room_id || !body.event_type) {
      return NextResponse.json(
        { error: "room_id and event_type are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert analytics event (RLS allows public inserts)
    const { error: eventError } = await supabase
      .from("analytics_events")
      .insert({
        room_id: body.room_id,
        visitor_id: body.visitor_id ?? null,
        event_type: body.event_type,
        event_data: body.event_data ?? null,
      });

    if (eventError) {
      return NextResponse.json(
        { error: eventError.message },
        { status: 500 }
      );
    }

    // If visitor_id is provided, update their last_visited_at
    if (body.visitor_id) {
      const { error: visitError } = await supabase
        .from("room_visits")
        .update({ last_visited_at: new Date().toISOString() })
        .eq("room_id", body.room_id)
        .eq("visitor_id", body.visitor_id);

      if (visitError) {
        console.error(
          "Failed to update room_visits.last_visited_at:",
          visitError.message
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
