import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/ideation/plays — list all plays (active + inactive), oldest first.
 * POST — create a play. Body: { name, description, triggers?, asset_hint?,
 *   cost_tier?, min_deal_size?, active? }
 */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("plays")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ plays: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    if (!body.name?.trim() || !body.description?.trim()) {
      return NextResponse.json(
        { error: "name and description are required" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("plays")
      .insert({
        name: body.name,
        description: body.description,
        triggers: body.triggers ?? "",
        asset_hint: body.asset_hint ?? null,
        cost_tier: body.cost_tier ?? 0,
        min_deal_size: body.min_deal_size ?? 0,
        origin: "manual",
        active: body.active ?? true,
      })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ play: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
