import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/utils";
import {
  OVERVIEW_SUB_TAB_KEYS,
  OVERVIEW_SUB_TAB_LABELS,
  OVERVIEW_SUB_TAB_SORT_ORDER,
  TRUST_PAGE_URL,
} from "@/lib/constants";
import { extractBrandAssets, domainFromEmail } from "@/lib/brand-colors";
import type { GranolaMeetingCache, GranolaMeetingParticipant } from "@/lib/types";

/**
 * POST /api/rooms/from-granola
 * Creates a new room from a cached Granola meeting.
 *
 * Body: { granola_cache_id: string }
 *
 * Automatically populates:
 * - Room: company_name, contact_name, contact_email, slug
 * - Meeting brief: summary content from Granola
 * - All other child tables: seeded with defaults
 */
export async function POST(request: Request) {
  try {
    const body: { granola_cache_id: string } = await request.json();

    if (!body.granola_cache_id) {
      return NextResponse.json(
        { error: "granola_cache_id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Fetch the cached Granola meeting
    const { data: meetingData, error: meetingError } = await admin
      .from("granola_meeting_cache")
      .select("*")
      .eq("id", body.granola_cache_id)
      .single();

    if (meetingError || !meetingData) {
      return NextResponse.json(
        { error: "Granola meeting not found in cache" },
        { status: 404 }
      );
    }

    const meeting = meetingData as GranolaMeetingCache;

    // 2. Extract prospect info from participants
    const participants = meeting.participants as GranolaMeetingParticipant[];
    const prospect = findProspectContact(participants);
    const companyName = meeting.company_name || prospect?.company || "Unknown";

    // 3. Extract brand assets (logo + color) from prospect's website
    let brandColor: string | null = null;
    let logoUrl: string | null = null;
    const contactEmail = meeting.contact_email ?? prospect?.email;
    if (contactEmail) {
      const domain = domainFromEmail(contactEmail);
      if (domain) {
        const assets = await extractBrandAssets(domain);
        brandColor = assets.brandColor;
        logoUrl = assets.logoUrl;
      }
    }

    // 4. Generate a unique slug
    let slug = generateSlug(companyName);
    const { data: existingSlugs } = await admin
      .from("rooms")
      .select("slug")
      .ilike("slug", `${slug}%`);

    if (existingSlugs && existingSlugs.length > 0) {
      slug = `${slug}-${existingSlugs.length + 1}`;
    }

    // 5. Create the room
    const { data: room, error: roomError } = await admin
      .from("rooms")
      .insert({
        slug,
        company_name: companyName,
        contact_name: prospect?.name ?? null,
        contact_email: meeting.contact_email ?? prospect?.email ?? null,
        logo_url: logoUrl,
        brand_primary_color: brandColor,
      })
      .select()
      .single();

    if (roomError) {
      return NextResponse.json(
        { error: roomError.message },
        { status: 500 }
      );
    }

    const roomId = room.id;

    // 6. Build meeting brief content from Granola summary
    const briefContent = buildBriefContent(meeting, participants);

    // 7. Create all child rows in parallel
    const [briefResult, subTabsResult, pricingResult, gettingStartedResult] =
      await Promise.all([
        admin.from("meeting_briefs").insert({
          room_id: roomId,
          content: briefContent,
        }),

        admin.from("overview_sub_tabs").insert(
          OVERVIEW_SUB_TAB_KEYS.map((key) => ({
            room_id: roomId,
            sub_tab_key: key,
            title: OVERVIEW_SUB_TAB_LABELS[key],
            content: "",
            youtube_url: key === "product_demo" ? "" : null,
            iframe_url: key === "security_compliance" ? TRUST_PAGE_URL : null,
            sort_order: OVERVIEW_SUB_TAB_SORT_ORDER[key],
          }))
        ),

        admin.from("pricing").insert({
          room_id: roomId,
          content: "",
        }),

        admin.from("getting_started").insert({
          room_id: roomId,
          integration_timeline: "",
          migration_steps: "",
          onboarding_plan: "",
        }),
      ]);

    // Check for child insert errors
    const childErrors = [
      briefResult.error,
      subTabsResult.error,
      pricingResult.error,
      gettingStartedResult.error,
    ].filter(Boolean);

    if (childErrors.length > 0) {
      await admin.from("rooms").delete().eq("id", roomId);
      return NextResponse.json(
        {
          error: "Failed to create room content",
          details: childErrors.map((e) => e!.message),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        room,
        message: `Room created for ${companyName} with meeting brief populated from Granola.`,
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

/* ------------------------------------------------------------------ */

/**
 * Find the main prospect contact (first non-Linkrunner participant).
 */
function findProspectContact(
  participants: GranolaMeetingParticipant[]
): GranolaMeetingParticipant | null {
  return (
    participants.find(
      (p) =>
        !p.is_creator &&
        !p.email?.endsWith("@linkrunner.io") &&
        p.name !== "Shreyans" &&
        p.name !== "Lakshith"
    ) ?? null
  );
}

/**
 * Build formatted meeting brief markdown from Granola meeting data.
 */
function buildBriefContent(
  meeting: GranolaMeetingCache,
  participants: GranolaMeetingParticipant[]
): string {
  const lines: string[] = [];

  lines.push(`# ${meeting.title}`);
  lines.push("");
  lines.push(
    `**Date:** ${new Date(meeting.meeting_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
  );
  lines.push("");

  // Prospect participants only
  const prospects = participants.filter(
    (p) =>
      !p.is_creator &&
      !p.email?.endsWith("@linkrunner.io") &&
      p.name !== "Shreyans" &&
      p.name !== "Lakshith"
  );

  if (prospects.length > 0) {
    const names = prospects
      .map((p) => {
        const parts = [p.name];
        if (p.company) parts.push(`(${p.company})`);
        if (p.email) parts.push(`— ${p.email}`);
        return parts.join(" ");
      })
      .join(", ");
    lines.push(`**Participants:** ${names}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  if (meeting.summary) {
    lines.push(meeting.summary);
  } else {
    lines.push(
      "*No meeting summary available. Add notes manually or re-sync from Granola.*"
    );
  }

  return lines.join("\n");
}
