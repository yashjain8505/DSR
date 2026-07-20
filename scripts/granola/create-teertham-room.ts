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
import { extractBrandAssets } from "../../src/lib/brand-colors";

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
const WEBSITE = "teertham.org";
/** Domain entry covers Raghav; Tushar is on gmail so he needs an exact row. */
const ACCESS_ENTRIES = ["@teertham.org", "tushargaudara@gmail.com"];

const BRIEF = `## Meeting Summary
Date: 20 July 2026
Attendees: Raghav Sehgal, Tushar Gaudara

## Your Situation
- Teertham is building the Urban Company for puja rituals: correctly-portioned samagri bundled with a vetted pundit, at a price that works because it removes the double margin customers pay when a pundit sources samagri himself.
- Pundits get demand they would otherwise buy from Google and JustDial; customers get a ritual that arrives complete. Roughly 1,000 pujas delivered in about fifteen months.
- The app relaunches this month, expanding from one-off pujas into daily use: panchang, horoscope, kundli guidance, festivals and events, with an AI pundit answering questions on top.
- That expansion is the point. Two or three pujas a year will not keep an app installed, so the relaunch is what turns a transactional app into a retained one.
- Built on Flutter. The immediate goal is a push on app installs across Meta and Google, plus OEM channels.

## Pain Points
- 70 to 80 percent of installs are expected to come from Meta and Google alone, with no reliable way today to see the full path across both.
- AppsFlyer was evaluated and is capable, but expensive and overkill at this stage.
- Attribution data needs to reach your internal knowledge hub, which runs on Open WebUI alongside Microsoft, Fireflies and HubSpot.
- Cost visibility is needed stage by stage, not just cost per install: what a signup costs versus what a completed purchase costs.
- Two campaign types need measuring differently: broad install campaigns, and puja-specific campaigns that must land the user on the right ritual after install.

## What We Showed You
- Flutter SDK integration. The fastest customers are live in three to four hours, typical is one to two days, against two to four weeks for legacy MMPs.
- A single acquisition table as the source of truth across organic, influencer, Google, referrals, Meta, offline QR, social and website, each carrying clicks, installs, signups, uninstalls, retention, revenue, spend, ROAS, CPI, CPS, suspicious installs and your own custom events such as puja started and puja done.
- White-labelled trackable links on your own domain, app.teertham.org, with deferred deep linking and OneLink. A user clicks, installs, signs up and lands on the exact puja page; if the app is already installed they go straight there. The same link works from push, WhatsApp, email, affiliates or a QR code, and nothing needs to be installed on your website.
- Drill-down to ad set and ad creative level, so creatives can be cut on revenue and retention rather than on install counts.
- Cost per event, configurable per event, split by campaign, ad set or creative.
- Data export three ways: APIs, webhooks fired on each new install, and CSV.
- Integrations across Google, Meta, TikTok, Reddit, Apple Search Ads, Snapchat and LinkedIn; analytics into Mixpanel, MoEngage, PostHog and RevenueCat; and 30 to 40 Indian affiliates.
- An MCP server for querying your own data from Claude and other assistants without opening the dashboard.

## Questions & Answers
- Does the SDK need to go on our website too? No. You generate a trackable link inside Linkrunner and use it anywhere; nothing is installed on the site.
- How deep does the reporting drill down? To ad set and ad creative, not just the source.
- Is multi-touch attribution production-ready, or does it still need ironing out? It is live and runs a last-click model today. The re-engagement view already shows reinstall and re-engagement paths across channels, so a user who installs from Google, deletes, then reinstalls from Meta and purchases appears there in full. Since multi-touch is your core reason for wanting an MMP, we would rather state the current position plainly than describe a roadmap.
- Can we track cost at every stage? Yes: cost per click, install, signup and purchase, split by link, campaign, ad set or creative. Install and signup are tracked by default. Revenue and other post-signup events need a one-time setup by your team, because Linkrunner cannot know where revenue occurs inside your app. Our tech team will sit with yours for that.
- Can Linkrunner feed our internal knowledge hub? Yes, through data APIs, webhooks or CSV into Open WebUI or any downstream system, which is what a number of our customers already do.
- How is an install attributed? On first open rather than on download. Expect a 5 to 10 percent discrepancy against Meta's reported installs, because some users download and never open. In exchange you get user-level data for every attributed install, which the ad networks will not give you; the MMP acts as the referee between them.
- What is genuinely missing compared with AppsFlyer? Connected-TV measurement, which we do not do at all, so no native Samsung, Sony or Bravia integrations. Breadth of integrations, where we are at roughly 150 against their 10,000, though any named partner takes about three days to add. Apple's ad affiliate is not connected yet and needs about three days once you confirm which one. Link and QR-code attribution works anywhere, including from a TV ad.
- Why is the cost so different? We are India-based, venture-backed and around 25 people, built over eighteen months. AppsFlyer carries fifteen to twenty years of legacy infrastructure cost. The difference shows up in integration breadth and connected TV, not in core attribution.

## Why It Matters
- With the relaunch turning Teertham into a daily-use app, the value of a paid install compounds. Measuring which channel produces retained users, rather than which produces installs, is what makes Meta and Google spend defensible.
- Deferred deep linking lets a puja-specific campaign drop a user directly into that ritual after install, which is where the conversion actually happens.
- Billing runs postpaid monthly through Razorpay, which you already use, so procurement is a vendor addition rather than a new payment rail.
- Every new account gets 25,000 free installs with no expiry, so you can validate our numbers against your own before committing spend.

## Next Steps
- Linkrunner to send the deck, commercial pricing and feature summary by email.
- Teertham to begin self-serve registration and integration; 25,000 free installs, no expiry.
- Tushar Gaudara to lead the integration, with a 10 to 15 minute walkthrough from our tech team whenever useful.
- Teertham to confirm which Apple ad affiliate is needed, roughly three days to connect.
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

  // 1. Pull logo + brand colors from the live site (best effort).
  let logoUrl: string | null = null;
  let primary: string | null = null;
  let secondary: string | null = null;
  try {
    const assets = await extractBrandAssets(WEBSITE);
    logoUrl = assets.logoUrl;
    primary = assets.brandColor;
    secondary = assets.secondaryColor;
    console.log(`brand: logo=${logoUrl ?? "(none)"} primary=${primary ?? "(none)"} secondary=${secondary ?? "(none)"}`);
  } catch (e) {
    console.warn(`brand extraction failed, continuing without: ${(e as Error).message}`);
  }

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
