import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomerReference } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ roomId: string; refId: string }> }
) {
  try {
    const { roomId, refId } = await params;
    const body: Partial<
      Pick<CustomerReference, "name" | "logo_url" | "is_visible" | "sort_order">
    > = await request.json();

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("customer_references")
      .update(body)
      .eq("id", refId)
      .eq("room_id", roomId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      customer_reference: data as CustomerReference,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ roomId: string; refId: string }> }
) {
  try {
    const { roomId, refId } = await params;
    const admin = createAdminClient();

    const { error } = await admin
      .from("customer_references")
      .delete()
      .eq("id", refId)
      .eq("room_id", roomId);

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
