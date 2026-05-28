import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { RoomWithContent, UpdateRoomPayload } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();

    // Fetch room and all related content in parallel
    const [
      roomResult,
      briefResult,
      subTabsResult,
      pricingResult,
      caseStudiesResult,
      comparisonsResult,
      gettingStartedResult,
      assetsResult,
    ] = await Promise.all([
      supabase.from("rooms").select("*").eq("id", roomId).single(),
      supabase
        .from("meeting_briefs")
        .select("*")
        .eq("room_id", roomId)
        .single(),
      supabase
        .from("overview_sub_tabs")
        .select("*")
        .eq("room_id", roomId)
        .order("sort_order", { ascending: true }),
      supabase.from("pricing").select("*").eq("room_id", roomId).single(),
      supabase
        .from("case_studies")
        .select("*")
        .eq("room_id", roomId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("comparisons")
        .select("*")
        .eq("room_id", roomId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("getting_started")
        .select("*")
        .eq("room_id", roomId)
        .single(),
      supabase
        .from("assets")
        .select("*")
        .order("category")
        .order("sort_order"),
    ]);

    if (roomResult.error) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    const data: RoomWithContent = {
      room: roomResult.data,
      meeting_brief: briefResult.data,
      overview_sub_tabs: subTabsResult.data ?? [],
      pricing: pricingResult.data,
      case_studies: caseStudiesResult.data ?? [],
      comparisons: comparisonsResult.data ?? [],
      getting_started: gettingStartedResult.data,
      assets: assetsResult.data ?? [],
    };

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body: UpdateRoomPayload = await request.json();
    const admin = createAdminClient();

    const { data: room, error } = await admin
      .from("rooms")
      .update(body)
      .eq("id", roomId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ room });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const admin = createAdminClient();

    const { error } = await admin.from("rooms").delete().eq("id", roomId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
