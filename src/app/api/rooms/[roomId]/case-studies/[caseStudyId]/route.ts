import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CaseStudy } from "@/lib/types";

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ roomId: string; caseStudyId: string }> }
) {
  try {
    const { roomId, caseStudyId } = await params;
    const body: Partial<
      Pick<
        CaseStudy,
        "title" | "customer_name" | "customer_logo_url" | "content" | "sort_order"
      >
    > = await request.json();

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("case_studies")
      .update(body)
      .eq("id", caseStudyId)
      .eq("room_id", roomId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ case_study: data as CaseStudy });
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
  }: { params: Promise<{ roomId: string; caseStudyId: string }> }
) {
  try {
    const { roomId, caseStudyId } = await params;
    const admin = createAdminClient();

    const { error } = await admin
      .from("case_studies")
      .delete()
      .eq("id", caseStudyId)
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
