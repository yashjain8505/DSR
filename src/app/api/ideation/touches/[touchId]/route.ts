import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { recordOutcome } from "@/lib/ideation/pipeline";

/**
 * PATCH /api/ideation/touches/[touchId]
 * Body: { status: "sent" | "skipped", outcome?: "reply" | "no_reply" | "meeting_booked" }
 * Records the outcome; wild cards that earn a reply or meeting are
 * auto-promoted into the play library.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ touchId: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { touchId } = await params;
    const body = await request.json();
    if (body.status !== "sent" && body.status !== "skipped") {
      return NextResponse.json(
        { error: "status must be 'sent' or 'skipped'" },
        { status: 400 },
      );
    }

    const touch = await recordOutcome(
      Number(touchId),
      body.status,
      body.outcome,
    );
    return NextResponse.json({ touch });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update touch" },
      { status: 500 },
    );
  }
}
