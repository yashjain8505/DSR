import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  OVERVIEW_SUB_TAB_KEYS,
  OVERVIEW_SUB_TAB_LABELS,
  OVERVIEW_SUB_TAB_SORT_ORDER,
  TRUST_PAGE_URL,
  DEFAULT_CUSTOMER_REFERENCES,
  DEFAULT_CASE_STUDIES,
} from "@/lib/constants";
import { extractBrandAssets, domainFromEmail, domainFromSlug } from "@/lib/brand-colors";
import { generateBriefFromTranscript } from "@/lib/brief-from-transcript";
import type { CreateRoomPayload, Room } from "@/lib/types";

// This handler turns a raw transcript into a structured brief (an LLM call) and
// fetches brand assets on top of several DB writes, so give it generous
// execution headroom. Deploy platforms cap this to their plan limit — advisory.
export const maxDuration = 60;

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const supabase = await createClient();

    const { data: rooms, error } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rooms: rooms as Room[] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Normalize a website URL, bare domain, or "@domain" down to a bare host
 * (no protocol, no "www.", no path, no leading "@"). Returns null if empty.
 */
function normalizeDomain(input?: string | null): string | null {
  if (!input) return null;
  let d = input.trim().toLowerCase();
  if (!d) return null;
  d = d
    .replace(/^@/, "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");
  d = d.split("/")[0].split("?")[0].split("#")[0].trim();
  return d || null;
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body: CreateRoomPayload = await request.json();

    if (!body.slug || !body.company_name) {
      return NextResponse.json(
        { error: "slug and company_name are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // --- Extract brand assets (logo + color) when possible ---
    let logoUrl = body.logo_url ?? null;
    let brandColor: string | null = null;
    let secondaryColor: string | null = null;

    // Resolve a domain for brand extraction: explicit website first, then the
    // access domain the admin entered, then the contact email, then the slug.
    const contactEmail = body.contact_email ?? null;
    const accessDomain = normalizeDomain(body.access_domain);
    let domain =
      normalizeDomain(body.website_url) ||
      accessDomain ||
      (contactEmail ? domainFromEmail(contactEmail) : null);
    if (!domain) {
      domain = await domainFromSlug(body.slug);
    }

    if (domain) {
      try {
        const assets = await extractBrandAssets(domain);
        if (assets.logoUrl && !logoUrl) logoUrl = assets.logoUrl;
        if (assets.brandColor) brandColor = assets.brandColor;
        if (assets.secondaryColor) secondaryColor = assets.secondaryColor;
      } catch {
        /* brand extraction is best-effort */
      }
    }

    // No extra fallback here — extractBrandAssets already ends with a
    // validated Google-favicon attempt; a null logo renders as a monogram,
    // which beats storing a URL that 404s.

    // Turn the raw meeting transcript into the structured, customer-POV brief
    // (empty content when no transcript is supplied).
    const brief = body.transcript?.trim()
      ? await generateBriefFromTranscript(body.transcript, {
          companyName: body.company_name,
          contactName: body.contact_name ?? null,
        })
      : { content: "", nextSteps: "" };

    // Create the room
    const { data: room, error: roomError } = await admin
      .from("rooms")
      .insert({
        slug: body.slug,
        company_name: body.company_name,
        logo_url: logoUrl,
        contact_name: body.contact_name ?? null,
        contact_email: contactEmail,
        brand_primary_color: brandColor,
        brand_secondary_color: secondaryColor,
        // Lock the room to the entered company domain (seeded below). Left open
        // when no access domain is provided.
        restrict_access: !!accessDomain,
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

    // Create child rows in parallel
    const [briefResult, subTabsResult, pricingResult, gettingStartedResult, refsResult, caseStudiesResult] =
      await Promise.all([
        // 1. Meeting brief (structured from the transcript, or empty)
        admin.from("meeting_briefs").insert({
          room_id: roomId,
          content: brief.content,
          next_steps: brief.nextSteps,
        }),

        // 2. Overview sub-tabs (one per key)
        admin.from("overview_sub_tabs").insert(
          OVERVIEW_SUB_TAB_KEYS.map((key) => ({
            room_id: roomId,
            sub_tab_key: key,
            title: OVERVIEW_SUB_TAB_LABELS[key],
            content: "",
            youtube_url: key === "product_demo" ? "" : null,
            iframe_url: key === "security_compliance" ? TRUST_PAGE_URL : key === "company_deck" ? "" : null,
            sort_order: OVERVIEW_SUB_TAB_SORT_ORDER[key],
          }))
        ),

        // 3. Pricing (empty content)
        admin.from("pricing").insert({
          room_id: roomId,
          content: "",
        }),

        // 4. Getting started (empty fields)
        admin.from("getting_started").insert({
          room_id: roomId,
          integration_timeline: "",
          migration_steps: "",
          onboarding_plan: "",
        }),

        // 5. Customer reference logos (seeded from defaults)
        admin.from("customer_references").insert(
          DEFAULT_CUSTOMER_REFERENCES.map((ref, i) => ({
            room_id: roomId,
            name: ref.name,
            logo_url: ref.logo_url,
            is_visible: true,
            sort_order: i,
          }))
        ),

        // 6. Case studies (seeded from linkrunner.io)
        admin.from("case_studies").insert(
          DEFAULT_CASE_STUDIES.map((cs, i) => ({
            room_id: roomId,
            title: cs.title,
            customer_name: cs.customer_name,
            customer_logo_url: cs.customer_logo_url,
            banner_url: cs.banner_url,
            url: cs.url,
            content: cs.content,
            sort_order: i,
          }))
        ),
      ]);

    // Check for errors in child inserts
    const childErrors = [
      briefResult.error,
      subTabsResult.error,
      pricingResult.error,
      gettingStartedResult.error,
      refsResult.error,
      caseStudiesResult.error,
    ].filter(Boolean);

    if (childErrors.length > 0) {
      // Clean up the room if child inserts fail
      await admin.from("rooms").delete().eq("id", roomId);
      return NextResponse.json(
        {
          error: "Failed to create room content",
          details: childErrors.map((e) => e!.message),
        },
        { status: 500 }
      );
    }

    // Domain-based access: everyone with the entered company domain can enter.
    // Best-effort — the room already exists, so a failure here shouldn't fail
    // creation (the admin can still add access manually).
    if (accessDomain) {
      const { error: accessError } = await admin
        .from("room_access")
        .insert({ room_id: roomId, email: `@${accessDomain}` });
      if (accessError) {
        console.warn(
          `[rooms] failed to seed domain access for ${body.slug}: ${accessError.message}`
        );
      }
    }

    return NextResponse.json({ room: room as Room }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
