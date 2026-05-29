import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MeetingBrief } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("meeting_briefs")
      .select("*")
      .eq("room_id", roomId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Meeting brief not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ meeting_brief: data as MeetingBrief });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body: { content?: string; next_steps?: string } = await request.json();

    const updates: Record<string, string> = {};
    if (typeof body.content === "string") updates.content = body.content;
    if (typeof body.next_steps === "string") updates.next_steps = body.next_steps;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "At least one of content or next_steps is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("meeting_briefs")
      .update(updates)
      .eq("room_id", roomId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ meeting_brief: data as MeetingBrief });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
