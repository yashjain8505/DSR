#!/usr/bin/env npx tsx
/**
 * Create (or update) the Freshyzo room as a PRE-MEETING room.
 *
 * Unlike create-teertham-room.ts there has been no call: nothing for Freshyzo
 * exists in granola_meeting_cache. So this seeds no meeting_briefs row and
 * hides the Recap tab instead of inventing a conversation — the Recap header is
 * hardcoded to "A recap of our conversation, prepared for your team"
 * (tab-meeting-brief.tsx), which would be false on a room built from public
 * information alone.
 *
 * Hiding it takes BOTH sub-page keys. computeVisibleTabs() in room-tabs.tsx
 * treats meeting_brief specially — it stays visible while *either* sub-page is
 * visible — so hidden_sections: ["meeting_brief"] would not work.
 *
 * When the first call happens, drop the two recap_* entries from
 * hidden_sections and insert a meeting_briefs row; everything else stands.
 *
 * Run from the linkrunner-dsr root:  npx --yes tsx scripts/granola/create-freshyzo-room.ts
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

const SLUG = "freshyzo";
const COMPANY = "Freshyzo";
/** Only address published on the site; no individual contact is listed. */
const CONTACT_EMAIL = "support@freshyzo.com";
const ACCESS_ENTRIES = ["@freshyzo.com"];
/** Both keys required — see the header note on computeVisibleTabs(). */
const HIDDEN_SECTIONS = ["recap_discussed", "recap_next_steps"];

/**
 * extractBrandAssets() finds nothing on freshyzo.com: the site has no favicon
 * (404) and references its logo by relative path. So the logo is mirrored into
 * our own `assets` bucket from source, and the colors are read off it by hand —
 * a green gradient wordmark with charcoal lettering. Secondary is null because
 * the only non-green is a neutral, not a distinct hue (same call extractBrandAssets
 * makes for single-hue logos).
 */
const LOGO_SRC_URL = "https://freshyzo.com/assets/images/hero/logo.png";
const LOGO_PATH = "logos/freshyzo.png";
/** Sampled from the logo: 93.9% of saturated pixels sit in this green. */
const PRIMARY = "#369845";
const SECONDARY: string | null = null;

async function main() {
  // 1. Mirror the source logo into our assets bucket (idempotent: upsert).
  const res = await fetch(LOGO_SRC_URL);
  if (!res.ok) throw new Error(`logo fetch: ${res.status} ${res.statusText}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const { error: upErr } = await sb.storage
    .from("assets")
    .upload(LOGO_PATH, bytes, { contentType: "image/png", upsert: true });
  if (upErr) throw new Error(`logo upload: ${upErr.message}`);
  const {
    data: { publicUrl: logoUrl },
  } = sb.storage.from("assets").getPublicUrl(LOGO_PATH);
  const primary = PRIMARY;
  const secondary = SECONDARY;
  console.log(`logo mirrored (${bytes.length} bytes) -> ${logoUrl}`);

  // 2. Create or update the room.
  const { data: existing } = await sb
    .from("rooms")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();

  if (existing) {
    await sb
      .from("rooms")
      .update({
        company_name: COMPANY,
        contact_email: CONTACT_EMAIL,
        logo_url: logoUrl,
        brand_primary_color: primary,
        brand_secondary_color: secondary,
        restrict_access: true,
        hidden_sections: HIDDEN_SECTIONS,
      })
      .eq("id", existing.id);
    for (const email of ACCESS_ENTRIES) {
      await sb
        .from("room_access")
        .upsert({ room_id: existing.id, email }, { onConflict: "room_id,email" });
    }
    console.log(`Updated existing room /room/${SLUG} (${existing.id}).`);

    for (const t of [
      "overview_sub_tabs",
      "pricing",
      "getting_started",
      "customer_references",
      "case_studies",
      "room_access",
    ]) {
      const { count } = await sb
        .from(t)
        .select("*", { count: "exact", head: true })
        .eq("room_id", existing.id);
      console.log(`  ${t.padEnd(22)} ${count ?? 0} row(s)${count ? "" : "  <- MISSING"}`);
    }
    return;
  }

  const { data: room, error: rErr } = await sb
    .from("rooms")
    .insert({
      slug: SLUG,
      company_name: COMPANY,
      contact_name: null,
      contact_email: CONTACT_EMAIL,
      logo_url: logoUrl,
      brand_primary_color: primary,
      brand_secondary_color: secondary,
      is_active: true,
      restrict_access: true,
      hidden_sections: HIDDEN_SECTIONS,
    })
    .select()
    .single();
  if (rErr) throw new Error(`room insert: ${rErr.message}`);
  const roomId = room.id;

  // No meeting_briefs row: there was no meeting.
  const results = await Promise.all([
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
    sb.from("room_access").insert(
      ACCESS_ENTRIES.map((email) => ({ room_id: roomId, email }))
    ),
  ]);
  const errs = results.map((r) => r.error).filter(Boolean);
  if (errs.length) {
    await sb.from("rooms").delete().eq("id", roomId);
    throw new Error("child insert failed: " + errs.map((e) => e!.message).join("; "));
  }

  console.log(`Created /room/${SLUG} (${roomId}).`);
  console.log(`  contact:  ${CONTACT_EMAIL} (generic — no individual listed on site)`);
  console.log(`  logo_url: ${logoUrl ?? "(none extracted)"}`);
  console.log(`  primary:  ${primary ?? "(none)"}  secondary: ${secondary ?? "(none)"}`);
  console.log(`  hidden:   ${HIDDEN_SECTIONS.join(", ")} (Recap tab off — no call yet)`);
  console.log(`  access:   restricted to ${ACCESS_ENTRIES.join(", ")} (+ any @linkrunner.io)`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
