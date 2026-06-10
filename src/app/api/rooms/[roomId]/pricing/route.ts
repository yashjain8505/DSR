import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Pricing, PricingTier } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { roomId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("pricing")
      .select("*")
      .eq("room_id", roomId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Pricing not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ pricing: data as Pricing });
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
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { roomId } = await params;
    const body: { content: string; pricing_data?: PricingTier[] } =
      await request.json();

    if (typeof body.content !== "string") {
      return NextResponse.json(
        { error: "content is required and must be a string" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const updateData: Record<string, unknown> = { content: body.content };
    if (body.pricing_data !== undefined) {
      updateData.pricing_data = body.pricing_data;
    }

    const { data, error } = await admin
      .from("pricing")
      .update(updateData)
      .eq("room_id", roomId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pricing: data as Pricing });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
