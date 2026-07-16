#!/usr/bin/env npx tsx
/**
 * Create (or update) the Fino Pay room with the user-provided logo set DIRECTLY.
 *
 * Mirrors the child-row seeding of POST /api/rooms/from-granola, but:
 *  - sets logo_url to the curated Fino Pay logo explicitly (the from-granola
 *    domain guess would never resolve to fino.bank.in, so it must be set here);
 *  - uses the structured meeting_brief already on the cache row (no LLM rewrite
 *    needed — it is already customer-POV).
 *
 * Run from the linkrunner-dsr root:  npx --no-install tsx scripts/granola/create-fino-room.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  OVERVIEW_SUB_TAB_KEYS,
  OVERVIEW_SUB_TAB_LABELS,
  OVERVIEW_SUB_TAB_SORT_ORDER,
  TRUST_PAGE_URL,
  DEFAULT_CUSTOMER_REFERENCES,
  DEFAULT_CASE_STUDIES,
} from "../../src/lib/constants";

// Load .env.local from the current working directory (run from repo root).
for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  if (!process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = t.slice(i + 1);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SLUG = "fino-pay";
const LOGO =
  "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/fino-pay.png";
const PRIMARY = "#e11b22"; // red star
const SECONDARY = "#3b2e9b"; // indigo arrow
const CACHE_ID = "local-finopay-ritika-2026-07-10";

function splitBrief(brief: string): { content: string; nextSteps: string } {
  const idx = brief.search(/\n#{1,4}\s*Next Steps/i);
  if (idx < 0) return { content: brief.trim(), nextSteps: "" };
  const content = brief.slice(0, idx).trim();
  const stepsBlock = brief.slice(idx).replace(/^[\s\S]*?Next Steps\s*:?\s*/i, "");
  const nextSteps = stepsBlock
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^-\s+/.test(l))
    .join("\n");
  return { content, nextSteps };
}

async function main() {
  const { data: cache, error: cErr } = await sb
    .from("granola_meeting_cache")
    .select("meeting_brief, company_name")
    .eq("granola_meeting_id", CACHE_ID)
    .single();
  if (cErr || !cache?.meeting_brief) throw new Error("No meeting_brief on cache row");
  const { content, nextSteps } = splitBrief(cache.meeting_brief as string);

  const { data: existing } = await sb
    .from("rooms")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();

  if (existing) {
    await sb
      .from("rooms")
      .update({ logo_url: LOGO, brand_primary_color: PRIMARY, brand_secondary_color: SECONDARY })
      .eq("id", existing.id);
    await sb
      .from("meeting_briefs")
      .upsert({ room_id: existing.id, content, next_steps: nextSteps }, { onConflict: "room_id" });
    console.log(`Updated existing room /room/${SLUG} (${existing.id}) — set your logo + brief.`);
    return;
  }

  const { data: room, error: rErr } = await sb
    .from("rooms")
    .insert({
      slug: SLUG,
      company_name: "Fino Pay",
      contact_name: "Ritika Barik",
      contact_email: null,
      logo_url: LOGO,
      brand_primary_color: PRIMARY,
      brand_secondary_color: SECONDARY,
      is_active: true,
      restrict_access: false,
    })
    .select()
    .single();
  if (rErr) throw new Error(`room insert: ${rErr.message}`);
  const roomId = room.id;

  const results = await Promise.all([
    sb.from("meeting_briefs").insert({ room_id: roomId, content, next_steps: nextSteps }),
    sb.from("overview_sub_tabs").insert(
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
    sb.from("pricing").insert({ room_id: roomId, content: "" }),
    sb.from("getting_started").insert({ room_id: roomId, integration_timeline: "", migration_steps: "", onboarding_plan: "" }),
    sb.from("customer_references").insert(
      DEFAULT_CUSTOMER_REFERENCES.map((r, i) => ({ room_id: roomId, name: r.name, logo_url: r.logo_url, is_visible: true, sort_order: i }))
    ),
    sb.from("case_studies").insert(
      DEFAULT_CASE_STUDIES.map((c, i) => ({
        room_id: roomId,
        title: c.title,
        customer_name: c.customer_name,
        customer_logo_url: c.customer_logo_url,
        banner_url: c.banner_url,
        url: c.url,
        content: c.content,
        sort_order: i,
      }))
    ),
  ]);
  const errs = results.map((r) => r.error).filter(Boolean);
  if (errs.length) {
    await sb.from("rooms").delete().eq("id", roomId);
    throw new Error("child insert failed: " + errs.map((e) => e!.message).join("; "));
  }

  console.log(`Created /room/${SLUG} (${roomId}) with your logo + structured brief.`);
  console.log(`  logo_url: ${LOGO}`);
  console.log(`  brief sections stored, next steps: ${nextSteps.split("\n").filter(Boolean).length}`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
