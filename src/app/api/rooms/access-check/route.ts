import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailAllowed } from "@/lib/room-access";

/**
 * POST /api/rooms/access-check
 * Public endpoint used by returning visitors (localStorage session) to
 * re-validate their email against a restricted room's allowlist.
 * Body: { room_id, email } → { allowed: boolean }.
 */
export async function POST(request: Request) {
  try {
    const body: { room_id?: string; email?: string } = await request.json();
    const email = (body.email ?? "").trim().toLowerCase();

    if (!body.room_id || !email) {
      return NextResponse.json(
        { error: "room_id and email are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // select("*") so rooms without the restrict_access column (pre-migration-007)
    // simply come back without it and stay open.
    const { data: room } = await admin
      .from("rooms")
      .select("*")
      .eq("id", body.room_id)
      .single();

    if (!room) {
      return NextResponse.json({ allowed: false });
    }

    if (room.restrict_access !== true) {
      return NextResponse.json({ allowed: true });
    }

    // Allowed by @linkrunner.io, an exact allowlist entry, or a domain entry.
    const allowed = await isEmailAllowed(admin, body.room_id, email);
    return NextResponse.json({ allowed });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
