import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatSignalsAsContext } from "@/lib/ideation/pipeline";

const EDITABLE = [
  "context",
  "contact_name",
  "persona",
  "stage",
  "deal_size",
  "current_vendor",
  "contract_end_date",
  "notes",
];

/**
 * PATCH /api/ideation/prospects/[prospectId]
 * - Field update: { context?, contact_name?, persona?, stage?, ... }
 * - Regenerate context: { action: "regenerate_context" } — overwrites
 *   `context` from the most recent run's signals.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ prospectId: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { prospectId } = await params;
    const body = await request.json();
    const admin = createAdminClient();

    if (body.action === "regenerate_context") {
      const { data: run, error: rErr } = await admin
        .from("runs")
        .select("signals")
        .eq("prospect_id", prospectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (rErr) {
        return NextResponse.json({ error: rErr.message }, { status: 500 });
      }
      if (!run) {
        return NextResponse.json(
          { error: "No run yet — run the engine on this prospect first." },
          { status: 400 },
        );
      }
      const { data, error } = await admin
        .from("prospects")
        .update({ context: formatSignalsAsContext(run.signals) })
        .eq("id", prospectId)
        .select()
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ prospect: data });
    }

    const update: Record<string, unknown> = {};
    for (const f of EDITABLE) if (body[f] !== undefined) update[f] = body[f];
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("prospects")
      .update(update)
      .eq("id", prospectId)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ prospect: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
