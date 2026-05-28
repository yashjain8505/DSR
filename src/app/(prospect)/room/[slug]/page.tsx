import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoomHeader } from "@/components/room/room-header";
import { RoomClientWrapper } from "@/components/room/room-client-wrapper";
import { computePalette } from "@/lib/brand-colors";
import type { RoomWithContent } from "@/lib/types";
import type { Metadata } from "next";

/** Linkrunner purple — used as fallback when room has no brand color. */
const DEFAULT_BRAND_COLOR = "#4d4bf7";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Generate dynamic metadata based on the room's company name.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("company_name")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!room) {
    return { title: "Room Not Found" };
  }

  return {
    title: `${room.company_name} — Linkrunner`,
    description: `Digital Sales Room for ${room.company_name}`,
  };
}

/**
 * Prospect-facing room page (server component).
 *
 * Fetches the room by slug directly from Supabase, then loads all
 * related tab content in parallel. If the room doesn't exist or
 * is inactive, shows the not-found page.
 */
export default async function RoomPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Resolve slug to room
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (roomError || !room) {
    notFound();
  }

  // 2. Fetch all tab content in parallel
  const [
    briefResult,
    subTabsResult,
    pricingResult,
    caseStudiesResult,
    comparisonsResult,
    gettingStartedResult,
    assetsResult,
  ] = await Promise.all([
    supabase
      .from("meeting_briefs")
      .select("*")
      .eq("room_id", room.id)
      .single(),
    supabase
      .from("overview_sub_tabs")
      .select("*")
      .eq("room_id", room.id)
      .order("sort_order", { ascending: true }),
    supabase.from("pricing").select("*").eq("room_id", room.id).single(),
    supabase
      .from("case_studies")
      .select("*")
      .eq("room_id", room.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("comparisons")
      .select("*")
      .eq("room_id", room.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("getting_started")
      .select("*")
      .eq("room_id", room.id)
      .single(),
    supabase
      .from("assets")
      .select("*")
      .order("category")
      .order("sort_order"),
  ]);

  const data: RoomWithContent = {
    room,
    meeting_brief: briefResult.data,
    overview_sub_tabs: subTabsResult.data ?? [],
    pricing: pricingResult.data,
    case_studies: caseStudiesResult.data ?? [],
    comparisons: comparisonsResult.data ?? [],
    getting_started: gettingStartedResult.data,
    assets: assetsResult.data ?? [],
  };

  // Compute brand palette from room's stored color or fallback
  const brandHex = room.brand_primary_color || DEFAULT_BRAND_COLOR;
  const palette = computePalette(brandHex);

  const brandVars = {
    "--brand-primary": palette.primary,
    "--brand-primary-light": palette.primaryLight,
    "--brand-primary-dark": palette.primaryDark,
    "--brand-secondary": "#4d4bf7",
    "--lr-purple": "#4d4bf7",
    "--lr-purple-light": "#eeedfe",
  } as React.CSSProperties;

  return (
    <div style={brandVars} className="min-h-screen">
      <RoomHeader
        companyName={room.company_name}
        logoUrl={room.logo_url}
      />
      <main className="flex-1">
        <RoomClientWrapper data={data} />
      </main>
    </div>
  );
}
