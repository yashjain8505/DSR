import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Comparison, ComparisonFeature } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("comparisons")
      .select("*")
      .eq("room_id", roomId)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comparisons: data as Comparison[] });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body: {
      competitor_name: string;
      competitor_logo_url?: string;
      content: string;
      comparison_data?: ComparisonFeature[];
      sort_order?: number;
    } = await request.json();

    if (!body.competitor_name || typeof body.content !== "string") {
      return NextResponse.json(
        { error: "competitor_name and content are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("comparisons")
      .insert({
        room_id: roomId,
        competitor_name: body.competitor_name,
        competitor_logo_url: body.competitor_logo_url ?? null,
        content: body.content,
        comparison_data: body.comparison_data ?? null,
        sort_order: body.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { comparison: data as Comparison },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
