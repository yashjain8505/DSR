import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EDITABLE = [
  "name",
  "description",
  "triggers",
  "asset_hint",
  "cost_tier",
  "min_deal_size",
  "active",
];

/**
 * PATCH /api/ideation/plays/[playId] — update fields or toggle `active`.
 * DELETE — remove a play.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ playId: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { playId } = await params;
    const body = await request.json();
    const update: Record<string, unknown> = {};
    for (const f of EDITABLE) if (body[f] !== undefined) update[f] = body[f];
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("plays")
      .update(update)
      .eq("id", playId)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ play: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ playId: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { playId } = await params;
    const admin = createAdminClient();
    const { error } = await admin.from("plays").delete().eq("id", playId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
