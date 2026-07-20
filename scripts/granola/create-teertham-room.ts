#!/usr/bin/env npx tsx
/**
 * Create (or update) the Teertham room from the 20 Jul 2026 intro call.
 *
 * Same shape as create-elixir-room.ts, with three differences:
 *  - the brief is hand-written below rather than generated from a cached
 *    transcript. This call was recorded on a personal Granola account, so it
 *    never reached granola_meeting_cache, and the raw transcript is heavily
 *    garbled by speech-to-text (the company domain alone appears as both
 *    "tear thumb.org" and "yatum.org") and opens with several minutes of
 *    unrelated internal chatter including partial card digits. Feeding that to
 *    Groq would launder the noise into the prospect-facing page.
 *  - brand assets are pulled live from the site via extractBrandAssets()
 *    instead of uploading a curated logo file.
 *  - restrict_access is true with explicit room_access rows. Note that Tushar
 *    is on gmail.com, so the @teertham.org domain entry does not cover him and
 *    he needs an exact-email row of his own.
 *
 * Run from the linkrunner-dsr root:  npx --yes tsx scripts/granola/create-teertham-room.ts
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

const SLUG = "teertham";
const COMPANY = "Teertham";
const CONTACT = "Raghav Sehgal";
const CONTACT_EMAIL = "admin@teertham.org";
/** Domain entry covers Raghav; Tushar is on gmail so he needs an exact row. */
const ACCESS_ENTRIES = ["@teertham.org", "tushargaudara@gmail.com"];

/**
 * extractBrandAssets() fell back to the site favicon — a 75x71 image — and
 * derived the palette from that, picking the mandala's teal as primary and a
 * dark red as accent, which inverts the real brand. The site publishes a proper
 * 600x200 logo by relative path, which the extractor doesn't resolve, so it is
 * mirrored into our own `assets` bucket instead of hotlinked.
 *
 * Colors sampled from that logo: the TEERTHAM wordmark red is 54.7% of
 * saturated pixels, and the mandala's teal is the one accent in a genuinely
 * distinct hue band (180-210deg against 330-360deg).
 */
const LOGO_SRC_URL = "https://teertham.org/images/teertham-logo.png";
const LOGO_PATH = "logos/teertham.png";
const PRIMARY = "#b13e49";
const SECONDARY: string | null = "#53bbbb";

const BRIEF = `## Meeting Summary
Date: 20 July 2026
Attendees: Raghav Sehgal, Tushar Gaudara

## Your Situation
- Urban Company for puja rituals: packaged samagri plus a vetted pundit, priced to remove the margin a pundit adds sourcing samagri himself.
- Around 1,000 pujas in fifteen months.
- Relaunching this month with panchang, horoscope, kundli, festivals and an AI pundit, so the app earns daily use instead of two visits a year.
- Flutter app. Next push is installs across Meta, Google and OEM channels.

## Pain Points
- 70 to 80 percent of installs will come from Meta and Google, with no view of the path across both.
- AppsFlyer is capable but expensive, and overkill at this stage.
- Attribution data needs to reach your Open WebUI knowledge hub.
- Cost needed per stage, signup versus purchase, not just per install.
- Puja-specific campaigns must land users on the right ritual after install.

## What We Showed You
- Flutter SDK: fastest customers live in three to four hours, one to two days typical, against two to four weeks for legacy MMPs.
- One table across every channel with clicks, installs, signups, retention, revenue, ROAS, CPI, CPS, suspicious installs and your own events.
- White-labelled links on app.teertham.org with deferred deep linking: click, install, land on the exact puja page. Nothing goes on your website.
- Drill-down to ad set and ad creative, so creatives are cut on revenue rather than install count.
- Cost per event, split by campaign, ad set or creative.
- Export by API, webhook or CSV into your knowledge hub.
- Integrations across the major ad networks, plus Mixpanel, MoEngage, PostHog, RevenueCat and 30 to 40 Indian affiliates.
- MCP for querying your data from Claude without opening the dashboard.

## Questions & Answers
- Does the SDK go on our website? No, trackable links only.
- How deep is the drill-down? Ad set and ad creative.
- Is multi-touch ready? Live, last-click today, with reinstall and re-engagement paths across channels. Stated plainly because it is your main reason for buying.
- Can we see cost at every stage? Click, install, signup and purchase. Install and signup work by default; revenue events need a one-time setup with your team.
- Can it feed our knowledge hub? Yes, by API, webhook or CSV.
- How is an install counted? On first open, not download. Expect 5 to 10 percent below Meta's number, in exchange for user-level data they will not give you.
- What is missing against AppsFlyer? No connected TV. Around 150 integrations against their 10,000, though any named partner takes about three days. Apple's ad affiliate is not connected yet.
- Why the price gap? India-based, around 25 people, eighteen months of build, against fifteen to twenty years of legacy infrastructure cost.

## Why It Matters
- A daily-use app makes each paid install worth more, so what matters is which channel produces retained users, not installs.
- Deferred deep linking drops users into the puja they clicked for, which is where conversion happens.
- Postpaid monthly via Razorpay, which you already use, so we are a vendor addition rather than a new payment rail.
- 25,000 free installs with no expiry, so you can check our numbers against yours before committing spend.

## Next Steps
- Linkrunner to send deck, pricing and feature summary by email.
- Teertham to start self-serve registration and integration.
- Tushar to lead integration; 10 to 15 minute walkthrough from our tech team on request.
- Teertham to confirm which Apple ad affiliate to connect, about three days.
`;

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
  const { content, nextSteps } = splitBrief(BRIEF);
  console.log(`brief: ${content.length} chars, ${nextSteps.split("\n").filter(Boolean).length} next steps`);

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
        contact_name: CONTACT,
        contact_email: CONTACT_EMAIL,
        logo_url: logoUrl,
        brand_primary_color: primary,
        brand_secondary_color: secondary,
        restrict_access: true,
      })
      .eq("id", existing.id);
    await sb
      .from("meeting_briefs")
      .upsert({ room_id: existing.id, content, next_steps: nextSteps }, { onConflict: "room_id" });
    for (const email of ACCESS_ENTRIES) {
      await sb
        .from("room_access")
        .upsert({ room_id: existing.id, email }, { onConflict: "room_id,email" });
    }
    console.log(`Updated existing room /room/${SLUG} (${existing.id}).`);

    for (const t of [
      "meeting_briefs",
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
      contact_name: CONTACT,
      contact_email: CONTACT_EMAIL,
      logo_url: logoUrl,
      brand_primary_color: primary,
      brand_secondary_color: secondary,
      is_active: true,
      restrict_access: true,
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
  console.log(`  contact:  ${CONTACT} <${CONTACT_EMAIL}>`);
  console.log(`  logo_url: ${logoUrl ?? "(none extracted)"}`);
  console.log(`  primary:  ${primary ?? "(none)"}  secondary: ${secondary ?? "(none)"}`);
  console.log(`  access:   restricted to ${ACCESS_ENTRIES.join(", ")} (+ any @linkrunner.io)`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
