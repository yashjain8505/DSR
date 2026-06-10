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
import type { CreateRoomPayload, Room } from "@/lib/types";

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
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
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

    // Try to get a domain: from contact_email first, then guess from slug
    const contactEmail = body.contact_email ?? null;
    let domain = contactEmail ? domainFromEmail(contactEmail) : null;
    if (!domain) {
      domain = await domainFromSlug(body.slug);
    }

    if (domain) {
      try {
        const assets = await extractBrandAssets(domain);
        if (assets.logoUrl && !logoUrl) logoUrl = assets.logoUrl;
        if (assets.brandColor) brandColor = assets.brandColor;
      } catch {
        /* brand extraction is best-effort */
      }
    }

    // No extra fallback here — extractBrandAssets already ends with a
    // validated Google-favicon attempt; a null logo renders as a monogram,
    // which beats storing a URL that 404s.

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
        // 1. Meeting brief (empty content)
        admin.from("meeting_briefs").insert({
          room_id: roomId,
          content: "",
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

    return NextResponse.json({ room: room as Room }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
