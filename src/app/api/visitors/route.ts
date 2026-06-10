import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSlackNotification } from "@/lib/slack";
import type { EmailGatePayload } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body: EmailGatePayload = await request.json();

    if (!body.email || !body.room_id) {
      return NextResponse.json(
        { error: "email and room_id are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const email = body.email.trim().toLowerCase();

    // 0. Look up the room and enforce the access allowlist when restricted.
    // select("*") keeps this working before migration 007 adds restrict_access.
    const { data: room } = await admin
      .from("rooms")
      .select("*")
      .eq("id", body.room_id)
      .single();

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.restrict_access === true) {
      const { data: allowed } = await admin
        .from("room_access")
        .select("id")
        .eq("room_id", body.room_id)
        .eq("email", email)
        .maybeSingle();

      if (!allowed) {
        return NextResponse.json(
          {
            error:
              "This room is private. Ask your Linkrunner contact to invite your email.",
          },
          { status: 403 }
        );
      }
    }

    // 1. Upsert visitor by email
    const { data: visitor, error: visitorError } = await admin
      .from("visitors")
      .upsert(
        {
          email: body.email,
          name: body.name ?? null,
          company: body.company ?? null,
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (visitorError) {
      return NextResponse.json(
        { error: visitorError.message },
        { status: 500 }
      );
    }

    // 2. Upsert room_visits
    const { error: visitError } = await admin.from("room_visits").upsert(
      {
        room_id: body.room_id,
        visitor_id: visitor.id,
        last_visited_at: new Date().toISOString(),
      },
      { onConflict: "room_id,visitor_id" }
    );

    if (visitError) {
      return NextResponse.json(
        { error: visitError.message },
        { status: 500 }
      );
    }

    // 3. Insert analytics event
    const { error: eventError } = await admin
      .from("analytics_events")
      .insert({
        room_id: body.room_id,
        visitor_id: visitor.id,
        event_type: "email_gate_submit",
        event_data: {
          email: body.email,
          name: body.name ?? null,
          company: body.company ?? null,
        },
      });

    if (eventError) {
      console.error("Failed to insert analytics event:", eventError.message);
    }

    // 4. Send Slack notification (fire and forget -- don't block response)
    sendSlackNotification({
      roomSlug: room.slug,
      companyName: room.company_name,
      visitorEmail: body.email,
      visitorName: body.name,
    }).catch((err) =>
      console.error("Slack notification failed:", err)
    );

    return NextResponse.json({ visitor_id: visitor.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
