import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GranolaMeetingCache } from "@/lib/types";

/**
 * GET /api/granola/meetings/[meetingId]
 * Fetch a single cached Granola meeting by its internal cache ID.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("granola_meeting_cache")
      .select("*")
      .eq("id", meetingId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ meeting: data as GranolaMeetingCache });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/granola/meetings/[meetingId]
 * Remove a cached Granola meeting.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    const admin = createAdminClient();

    const { error } = await admin
      .from("granola_meeting_cache")
      .delete()
      .eq("id", meetingId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
