#!/usr/bin/env npx tsx
/**
 * Create (or update) the Elixir Cards room from the synced Granola meeting.
 *
 * Same shape as create-fino-room.ts (the from-granola domain guess is bypassed
 * because the logo is user-supplied), with two differences:
 *  - uploads the curated logo to the `assets` bucket first, then uses its
 *    public URL (Fino's logo was already in storage);
 *  - generates the meeting_brief from the cached transcript via Groq, since the
 *    cache row is transcript-only (synced from a shared note, not the API).
 *
 * Brand colors: the logo is single-hue (every saturated bucket sits at hue ~12°),
 * so secondary is left null - the same thing extractBrandAssets() returns when
 * no second hue is distinct.
 *
 * Run from the linkrunner-dsr root:  npx --no-install tsx scripts/granola/create-elixir-room.ts
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

const SLUG = "elixir-cards";
const COMPANY = "Elixir Cards";
const CONTACT = "Ritik Madan";
const PRIMARY = "#d33911"; // orange-red mark
const SECONDARY: string | null = null; // single-hue logo
const CACHE_ID = "4160d313-2f4a-48ff-90cd-5e94e3abfd8a";
const LOGO_SRC =
  "/Users/yashjain/.claude/image-cache/67bfb21b-1d96-4b15-ae3d-bd6ab3aa4429/2.png";
const LOGO_PATH = "logos/elixir-cards.png";

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
  // 1. Upload the curated logo (idempotent: upsert).
  const bytes = readFileSync(LOGO_SRC);
  const { error: upErr } = await sb.storage
    .from("assets")
    .upload(LOGO_PATH, bytes, { contentType: "image/png", upsert: true });
  if (upErr) throw new Error(`logo upload: ${upErr.message}`);
  const {
    data: { publicUrl: LOGO },
  } = sb.storage.from("assets").getPublicUrl(LOGO_PATH);
  console.log(`logo uploaded -> ${LOGO}`);

  // 2. Load the cached meeting (transcript lives in `summary`).
  const { data: cache, error: cErr } = await sb
    .from("granola_meeting_cache")
    .select("meeting_brief, summary, company_name, meeting_date")
    .eq("granola_meeting_id", CACHE_ID)
    .single();
  if (cErr || !cache) throw new Error(`cache row: ${cErr?.message ?? "not found"}`);

  // 3. Generate the brief if the row doesn't already carry one.
  let brief = (cache.meeting_brief as string | null) ?? "";
  if (!brief.trim()) {
    const { generateBriefFromTranscript } = await import(
      "../../src/lib/brief-from-transcript"
    );
    const out = await generateBriefFromTranscript((cache.summary as string) ?? "", {
      companyName: COMPANY,
      contactName: CONTACT,
      meetingDate: cache.meeting_date as string,
    });
    brief = [out.content, out.nextSteps && `\n## Next Steps\n${out.nextSteps}`]
      .filter(Boolean)
      .join("\n");
    if (!brief.trim()) throw new Error("brief generation produced nothing");
    const { error: bErr } = await sb
      .from("granola_meeting_cache")
      .update({ meeting_brief: brief })
      .eq("granola_meeting_id", CACHE_ID);
    if (bErr) throw new Error(`cache brief write: ${bErr.message}`);
    console.log(`brief generated (${brief.length} chars) and cached`);
  } else {
    console.log(`brief already on cache row (${brief.length} chars) - reusing`);
  }

  const { content, nextSteps } = splitBrief(brief);

  // 4. Create or update the room.
  const { data: existing } = await sb
    .from("rooms")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();

  if (existing) {
    await sb
      .from("rooms")
      .update({
        logo_url: LOGO,
        brand_primary_color: PRIMARY,
        brand_secondary_color: SECONDARY,
      })
      .eq("id", existing.id);
    await sb
      .from("meeting_briefs")
      .upsert({ room_id: existing.id, content, next_steps: nextSteps }, { onConflict: "room_id" });
    console.log(`Updated existing room /room/${SLUG} (${existing.id}).`);

    // The update branch skips child-row seeding, so report what the room
    // actually has - a room created by another path may be missing rows.
    for (const t of [
      "meeting_briefs",
      "overview_sub_tabs",
      "pricing",
      "getting_started",
      "customer_references",
      "case_studies",
    ]) {
      const { count } = await sb
        .from(t)
        .select("*", { count: "exact", head: true })
        .eq("room_id", existing.id);
      console.log(`  ${t.padEnd(22)} ${count ?? 0} row(s)${count ? "" : "  <- MISSING"}`);
    }
    const { data: r } = await sb
      .from("rooms")
      .select("company_name, contact_name, logo_url, brand_primary_color, brand_secondary_color, is_active")
      .eq("id", existing.id)
      .single();
    console.log("  room:", JSON.stringify(r, null, 2).replace(/\n/g, "\n  "));
    return;
  }

  const { data: room, error: rErr } = await sb
    .from("rooms")
    .insert({
      slug: SLUG,
      company_name: COMPANY,
      contact_name: CONTACT,
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
    sb.from("getting_started").insert({
      room_id: roomId,
      integration_timeline: "",
      migration_steps: "",
      onboarding_plan: "",
    }),
    sb.from("customer_references").insert(
      DEFAULT_CUSTOMER_REFERENCES.map((r, i) => ({
        room_id: roomId,
        name: r.name,
        logo_url: r.logo_url,
        is_visible: true,
        sort_order: i,
      }))
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

  console.log(`Created /room/${SLUG} (${roomId}).`);
  console.log(`  logo_url: ${LOGO}`);
  console.log(`  primary:  ${PRIMARY}  secondary: ${SECONDARY ?? "(null - single-hue logo)"}`);
  console.log(`  next steps: ${nextSteps.split("\n").filter(Boolean).length}`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
