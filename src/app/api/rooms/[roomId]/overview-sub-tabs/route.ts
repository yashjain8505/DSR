import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { OverviewSubTab } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("overview_sub_tabs")
      .select("*")
      .eq("room_id", roomId)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      overview_sub_tabs: data as OverviewSubTab[],
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

interface SubTabUpdate {
  id: string;
  content: string;
  youtube_url?: string | null;
  iframe_url?: string | null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body: SubTabUpdate[] = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Body must be an array of sub-tab updates" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Update each sub-tab in parallel
    const results = await Promise.all(
      body.map((item) => {
        const updateData: Record<string, unknown> = {
          content: item.content,
        };
        if (item.youtube_url !== undefined) {
          updateData.youtube_url = item.youtube_url;
        }
        if (item.iframe_url !== undefined) {
          updateData.iframe_url = item.iframe_url;
        }

        return admin
          .from("overview_sub_tabs")
          .update(updateData)
          .eq("id", item.id)
          .eq("room_id", roomId)
          .select()
          .single();
      })
    );

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Failed to update some sub-tabs",
          details: errors.map((e) => e.error!.message),
        },
        { status: 500 }
      );
    }

    const updatedTabs = results.map((r) => r.data as OverviewSubTab);

    return NextResponse.json({ overview_sub_tabs: updatedTabs });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
