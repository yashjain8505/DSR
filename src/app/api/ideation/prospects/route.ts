import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/ideation/prospects — list prospects (newest first).
 * POST /api/ideation/prospects — create a prospect; optionally attach a
 * manual transcript dump in the same call:
 * { company, contact_name?, persona?, stage?, deal_size?, current_vendor?,
 *   contract_end_date?, room_id?, notes?,
 *   transcript?: { title?, meeting_date?, content } }
 */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("prospects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ prospects: data });
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
    if (!body.company) {
      return NextResponse.json(
        { error: "company is required" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data: prospect, error } = await admin
      .from("prospects")
      .insert({
        company: body.company,
        contact_name: body.contact_name ?? null,
        persona: body.persona ?? null,
        stage: body.stage ?? "new",
        deal_size: body.deal_size ?? null,
        current_vendor: body.current_vendor ?? null,
        contract_end_date: body.contract_end_date ?? null,
        room_id: body.room_id ?? null,
        notes: body.notes ?? null,
      })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (body.transcript?.content) {
      const { error: tErr } = await admin.from("transcripts").insert({
        prospect_id: prospect.id,
        source: body.transcript.source ?? "manual",
        meeting_date: body.transcript.meeting_date ?? null,
        title: body.transcript.title ?? null,
        content: body.transcript.content,
      });
      if (tErr) {
        return NextResponse.json(
          { error: `prospect created, transcript failed: ${tErr.message}` },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ prospect }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
