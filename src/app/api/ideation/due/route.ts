import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { dueThisWeek, sendWeeklyDigest } from "@/lib/ideation/pipeline";

/**
 * GET /api/ideation/due — touches due in the next 7 days (the Monday view).
 * POST /api/ideation/due — send the weekly digest to Slack
 * (DIGEST_WEBHOOK_URL, falling back to SLACK_WEBHOOK_URL).
 */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const touches = await dueThisWeek();
    return NextResponse.json({ touches });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load touches" },
      { status: 500 },
    );
  }
}

export async function POST() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const result = await sendWeeklyDigest();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send digest" },
      { status: 500 },
    );
  }
}
