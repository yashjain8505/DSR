import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  GranolaMeetingCache,
  SyncGranolaMeetingPayload,
} from "@/lib/types";

/**
 * GET /api/granola/meetings
 * List all cached Granola meetings, ordered by meeting date (newest first).
 * Optional query param: ?company=name to filter by company.
 */
export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get("company");

    const admin = createAdminClient();

    let query = admin
      .from("granola_meeting_cache")
      .select("*")
      .order("meeting_date", { ascending: false });

    if (company) {
      query = query.ilike("company_name", `%${company}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      meetings: data as GranolaMeetingCache[],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/granola/meetings
 * Sync one or more Granola meetings into the cache.
 * Accepts a single meeting or an array of meetings.
 * Upserts on granola_meeting_id (updates if already cached).
 */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body: SyncGranolaMeetingPayload | SyncGranolaMeetingPayload[] =
      await request.json();

    const meetings = Array.isArray(body) ? body : [body];

    // Validate each meeting
    for (const meeting of meetings) {
      if (!meeting.granola_meeting_id || !meeting.title || !meeting.meeting_date) {
        return NextResponse.json(
          {
            error:
              "Each meeting must have granola_meeting_id, title, and meeting_date",
          },
          { status: 400 }
        );
      }
    }

    const admin = createAdminClient();

    const rows = meetings.map((m) => ({
      granola_meeting_id: m.granola_meeting_id,
      title: m.title,
      meeting_date: m.meeting_date,
      participants: m.participants ?? [],
      summary: m.summary ?? "",
      company_name: m.company_name ?? null,
      contact_email: m.contact_email ?? null,
      synced_at: new Date().toISOString(),
    }));

    const { data, error } = await admin
      .from("granola_meeting_cache")
      .upsert(rows, { onConflict: "granola_meeting_id" })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        synced: data.length,
        meetings: data as GranolaMeetingCache[],
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
