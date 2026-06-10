import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { GettingStarted } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { roomId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("getting_started")
      .select("*")
      .eq("room_id", roomId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Getting started not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      getting_started: data as GettingStarted,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { roomId } = await params;
    const body: {
      integration_timeline: string;
      migration_steps: string;
      onboarding_plan: string;
    } = await request.json();

    if (
      typeof body.integration_timeline !== "string" ||
      typeof body.migration_steps !== "string" ||
      typeof body.onboarding_plan !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "integration_timeline, migration_steps, and onboarding_plan are required strings",
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("getting_started")
      .update({
        integration_timeline: body.integration_timeline,
        migration_steps: body.migration_steps,
        onboarding_plan: body.onboarding_plan,
      })
      .eq("room_id", roomId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      getting_started: data as GettingStarted,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
