import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Comparison } from "@/lib/types";

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ roomId: string; comparisonId: string }> }
) {
  try {
    const { roomId, comparisonId } = await params;
    const body: Partial<
      Pick<
        Comparison,
        | "competitor_name"
        | "competitor_logo_url"
        | "content"
        | "comparison_data"
        | "sort_order"
      >
    > = await request.json();

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("comparisons")
      .update(body)
      .eq("id", comparisonId)
      .eq("room_id", roomId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comparison: data as Comparison });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ roomId: string; comparisonId: string }> }
) {
  try {
    const { roomId, comparisonId } = await params;
    const admin = createAdminClient();

    const { error } = await admin
      .from("comparisons")
      .delete()
      .eq("id", comparisonId)
      .eq("room_id", roomId);

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
