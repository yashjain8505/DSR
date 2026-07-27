import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { timingSafeEqual } from "crypto";
import { fetchUpcomingEvents, calendarConfigured } from "@/lib/calendar-ics";
import { findRoomForEmail, buildPrepDoc } from "@/lib/call-prep";
import { sendCallPrepDoc } from "@/lib/slack";

export const maxDuration = 60;

/**
 * Fire a prep doc when a meeting starts within this window from now. The lower
 * bound (25) sits just under the 30-min target; the width (25-35) is wider than
 * the ~5-min cron cadence so a slightly late run still catches the meeting, and
 * the call_prep_log dedup guarantees it still only fires once.
 */
const LEAD_MIN_LOW = 25;
const LEAD_MIN_HIGH = 35;

async function runCallPrep({ test = false }: { test?: boolean } = {}) {
  if (!calendarConfigured()) {
    return NextResponse.json({ error: "CALENDAR_ICS_URL not configured" }, { status: 500 });
  }
  const admin = createAdminClient();
  const now = Date.now();

  const listed = await fetchUpcomingEvents(now + LEAD_MIN_LOW * 60_000, now + LEAD_MIN_HIGH * 60_000);
  if (!listed.ok) {
    return NextResponse.json({ error: listed.error }, { status: 502 });
  }

  let prepped = 0;
  let skippedNoRoom = 0;
  const notes: string[] = [];

  for (const event of listed.events) {
    // Dedup: one prep doc per calendar event.
    const { data: already } = await admin
      .from("call_prep_log")
      .select("calendar_event_id")
      .eq("calendar_event_id", event.id)
      .maybeSingle();
    if (already) continue;

    // Match the first attendee that maps to a DSR room.
    let matched: { roomId: string; slug: string; company: string; email: string } | null = null;
    for (const email of event.attendeeEmails) {
      const room = await findRoomForEmail(admin, email);
      if (room) {
        matched = { roomId: room.id, slug: room.slug, company: room.company_name, email };
        break;
      }
    }
    if (!matched) {
      skippedNoRoom++;
      continue;
    }

    const doc = await buildPrepDoc(admin, matched.roomId, matched.email);
    const minutesUntil = Math.max(1, Math.round((event.startMs - now) / 60_000));

    const ok = await sendCallPrepDoc({
      personName: doc.personName,
      companyName: matched.company,
      roomSlug: matched.slug,
      meetingTitle: event.title,
      minutesUntil,
      activeTimeLabel: doc.activeTimeLabel,
      sectionLines: doc.sectionLines,
      actionLines: doc.actionLines,
      hasActivity: doc.hasActivity,
      test,
    });

    if (ok) {
      // Don't persist the dedup marker for test runs, so a real run still fires.
      if (!test) {
        await admin.from("call_prep_log").insert({ calendar_event_id: event.id });
      }
      prepped++;
      notes.push(`${matched.company} (${matched.slug})`);
    }
  }

  return NextResponse.json({
    upcoming: listed.events.length,
    prepped,
    skipped_no_room: skippedNoRoom,
    notes,
  });
}

/**
 * GET /api/cron/call-prep — scheduled run. CRON_SECRET bearer auth. Vercel Hobby
 * caps cron at daily, so an external scheduler (Supabase pg_cron / cron-job.org)
 * hits this every ~5 min, same as /api/cron/sessions.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const provided = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const test = new URL(request.url).searchParams.get("test") === "1";
  try {
    return await runCallPrep({ test });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "call-prep cron failed" },
      { status: 500 }
    );
  }
}

/** POST /api/cron/call-prep — admin-triggered manual run. ?test=1 tags as [TEST]. */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const test = new URL(request.url).searchParams.get("test") === "1";
  try {
    return await runCallPrep({ test });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "call-prep cron failed" },
      { status: 500 }
    );
  }
}
