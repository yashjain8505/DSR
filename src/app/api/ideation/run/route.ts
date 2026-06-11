import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { runIdeation } from "@/lib/ideation/pipeline";

// Four LLM calls per run — needs more than the default function timeout.
export const maxDuration = 300;

/**
 * POST /api/ideation/run
 * Body: { prospect_id: number }
 * Runs the full ideation pipeline (extract → match + create → critique),
 * persists the run + touches, and returns the output.
 */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const prospectId = Number(body.prospect_id);
    if (!prospectId) {
      return NextResponse.json(
        { error: "prospect_id is required" },
        { status: 400 },
      );
    }

    const result = await runIdeation(prospectId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ideation run failed" },
      { status: 500 },
    );
  }
}
