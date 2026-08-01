import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCtaClickAlert } from "@/lib/slack";
import { displayNameFromEmail } from "@/lib/session-summary";
import { EVENT_TYPES, TRACKED_CTAS, type TrackedCtaKey } from "@/lib/constants";

/**
 * POST /api/analytics/cta-click — a prospect clicked a booking CTA in the room.
 *
 * Records the click as a normal `link_click` analytics event AND posts a Slack
 * alert immediately. Sign-in/sign-out pings are reconstructed after the fact by
 * `/api/cron/sessions` (they have to be — there is no "sign-out" event to hang
 * them on), but a booking-intent click is a discrete event and the hottest
 * signal in the room, so it alerts inline rather than waiting up to ~5 minutes
 * for the external scheduler.
 *
 * **Deliberately public**, like `/api/analytics` — prospects are unauthenticated.
 * Three things keep that from being a Slack-spam vector:
 *   1. The alert text is built from `TRACKED_CTAS`, never from the request body,
 *      so no caller can inject message content (or an `@channel`) into Slack.
 *   2. `visitor_id` must resolve to a real `visitors` row; unknown ids are
 *      recorded but never alerted.
 *   3. Repeat clicks by the same visitor in the same room collapse into one
 *      alert per DEDUP_MIN window.
 */

/** Collapse repeat clicks (double-clicks, re-reads) into a single alert. */
const DEDUP_MIN = 30;

interface CtaClickPayload {
  room_id?: string;
  visitor_id?: string | null;
  cta?: string;
}

function isTrackedCta(key: string): key is TrackedCtaKey {
  return Object.prototype.hasOwnProperty.call(TRACKED_CTAS, key);
}

export async function POST(request: Request) {
  try {
    const body: CtaClickPayload = await request.json();
    const roomId = body.room_id;
    const visitorId = body.visitor_id ?? null;
    const cta = body.cta ?? "";

    if (!roomId || !isTrackedCta(cta)) {
      return NextResponse.json(
        { error: "room_id and a known cta are required" },
        { status: 400 }
      );
    }

    const { label, url } = TRACKED_CTAS[cta];
    const admin = createAdminClient();

    // Record the click first, and keep its timestamp: the dedup check below
    // counts only clicks STRICTLY OLDER than this row. Two racing clicks
    // therefore resolve deterministically — the earlier row sees no prior click
    // and alerts, the later one sees it and stays quiet. (Checking before the
    // insert would let both race through; counting all rows would silence both.)
    const { data: inserted, error: insertError } = await admin
      .from("analytics_events")
      .insert({
        room_id: roomId,
        visitor_id: visitorId,
        event_type: EVENT_TYPES.LINK_CLICK,
        event_data: { cta, label, url, tab: "pricing" },
      })
      .select("created_at")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: insertError?.message ?? "failed to record click" },
        { status: 500 }
      );
    }

    // Everything past here is the alert; a failure to notify must not fail the
    // click, so the response stays 200 either way.
    if (!visitorId) {
      return NextResponse.json({ success: true, alerted: false });
    }

    const since = new Date(
      Date.parse(inserted.created_at) - DEDUP_MIN * 60_000
    ).toISOString();
    const { count: priorClicks } = await admin
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId)
      .eq("visitor_id", visitorId)
      .eq("event_type", EVENT_TYPES.LINK_CLICK)
      .eq("event_data->>cta", cta)
      .gte("created_at", since)
      .lt("created_at", inserted.created_at);

    if ((priorClicks ?? 0) > 0) {
      return NextResponse.json({ success: true, alerted: false });
    }

    const [{ data: visitor }, { data: room }] = await Promise.all([
      admin.from("visitors").select("email").eq("id", visitorId).maybeSingle(),
      admin
        .from("rooms")
        .select("slug, company_name")
        .eq("id", roomId)
        .maybeSingle(),
    ]);

    // Unknown visitor, unknown room, or one of our own — recorded, not announced.
    // The internal-email exclusion matches the session cron and the dashboard.
    const email = visitor?.email as string | undefined;
    if (
      !email ||
      !room ||
      email.toLowerCase().endsWith("@linkrunner.io")
    ) {
      return NextResponse.json({ success: true, alerted: false });
    }

    // ?test=1 tags the alert [TEST] so a manual trigger is never mistaken for
    // a real prospect click.
    const test = new URL(request.url).searchParams.get("test") === "1";
    const alerted = await sendCtaClickAlert({
      personName: displayNameFromEmail(email),
      companyName: room.company_name as string,
      ctaLabel: label,
      roomSlug: room.slug as string,
      when: new Date(inserted.created_at),
      test,
    });

    return NextResponse.json({ success: true, alerted });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
