import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  loadCompanyContext,
  loadDataAssets,
  loadKnowledgeBase,
} from "@/lib/ideation/prompts";
import type { EngineConfigKey } from "@/lib/types";

const KEYS: EngineConfigKey[] = [
  "company_context",
  "data_assets",
  "knowledge_base",
];

/**
 * GET /api/ideation/config — the engine base layer as { key: value }.
 * PUT — update one or more keys:
 *   { company_context?, data_assets?, knowledge_base? }
 * `data_assets` is validated as JSON before saving.
 */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("engine_config")
      .select("key, value");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const fromDb: Record<string, string> = {};
    for (const row of data ?? []) fromDb[row.key] = row.value;
    // Fall back to the config/ files for any key not yet in the DB, so the
    // editor always shows the effective base layer (and saving persists it).
    const config = {
      company_context: fromDb.company_context ?? loadCompanyContext(),
      data_assets: fromDb.data_assets ?? loadDataAssets(),
      knowledge_base: fromDb.knowledge_base ?? loadKnowledgeBase(),
    };
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const rows = KEYS.filter((k) => typeof body[k] === "string").map((k) => ({
      key: k,
      value: body[k] as string,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "Provide at least one of: company_context, data_assets, knowledge_base",
        },
        { status: 400 },
      );
    }

    // data_assets is injected into prompts as JSON — reject invalid JSON.
    const da = rows.find((r) => r.key === "data_assets");
    if (da) {
      try {
        JSON.parse(da.value);
      } catch {
        return NextResponse.json(
          { error: "data_assets must be valid JSON" },
          { status: 400 },
        );
      }
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("engine_config")
      .upsert(rows, { onConflict: "key" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
