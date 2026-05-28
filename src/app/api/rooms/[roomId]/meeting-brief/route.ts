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
    const body: { content: string } = await request.json();

    if (typeof body.content !== "string") {
      return NextResponse.json(
        { error: "content is required and must be a string" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("meeting_briefs")
      .update({ content: body.content })
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
