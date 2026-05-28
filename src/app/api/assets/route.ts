import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Asset, SaveAssetPayload } from "@/lib/types";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .order("category")
      .order("sort_order");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assets: data as Asset[] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: SaveAssetPayload = await request.json();

    if (!body.title?.trim() || !body.category?.trim()) {
      return NextResponse.json(
        { error: "title and category are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("assets")
      .insert({
        category: body.category,
        title: body.title,
        asset_type: body.asset_type || "markdown",
        content: body.content || "",
        url: body.url ?? null,
        sort_order: body.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ asset: data as Asset }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body: SaveAssetPayload & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.asset_type !== undefined) updateData.asset_type = body.asset_type;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

    const { data, error } = await admin
      .from("assets")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ asset: data as Asset });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { error } = await admin.from("assets").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
