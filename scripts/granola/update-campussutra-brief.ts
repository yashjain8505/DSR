#!/usr/bin/env npx tsx
/**
 * Rewrite the Campus Sutra room's meeting brief from the 23 Jul 2026 intro call
 * ("Linkrunner <> Swapnil || Intro call").
 *
 * The stored brief was the raw speech-to-text transcript dumped verbatim as
 * bullets — speaker labels, internal chatter and all (Groq brief generation had
 * fallen back to a transcript dump). This replaces it with a hand-written
 * structured recap built from the transcript, which is heavily garbled and
 * arrived with its sections out of order (the "Notes"/discovery half came after
 * the "Pain Points"/wrap-up half). Office small talk and speaker noise dropped.
 *
 * Hard per-install pricing is kept out of the recap by design — parseBrief
 * strips any /pric/i section and pricing has its own tab — so the commercial
 * model is captured in Q&A without the paisa figure.
 *
 * Brand/logo/name are corrected separately via set-room-brand.ts (the room had
 * Cahoot's logo and blue palette from a bad auto-extraction). See the changelog.
 *
 * Run from the linkrunner-dsr root:  npx --yes tsx scripts/granola/update-campussutra-brief.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";

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

const SLUG = "campussutra";

const CONTENT = `## Meeting Summary
Date: July 23, 2026
Attendees: Kaushik Tibrewal, Swapnil Sangam

## Your Situation
- D2C fashion brand; the app is now roughly 20 to 30 percent of revenue, about 60 to 75 lakh a month, and becoming a primary channel
- App launched about a year ago, with no MMP in place yet
- Most installs are organic — a strong website nudge pushes shoppers to the app for a first-order discount
- Recently began scaling Meta app-install campaigns at around 15 rupees per install
- The app is built and run by a third-party app builder, not an in-house tech team

## Pain Points
- New to attribution: not sending conversion postbacks, and unsure which sources actually drive value
- As the app moves toward 30 percent of revenue, guesswork on attribution is getting expensive
- Cost-sensitive as a bootstrapped, growing brand — a new tool needs a clear internal case
- Open worries about iOS deferred deep linking breaking, and about catalog ads for a large fashion catalog

## What We Showed You
- One source of truth: every install by source — organic, Meta, Google, referral, QR, influencer — with hundreds of metrics each
- Custom events (add to cart, purchase complete, subscription) to define a "good user" and follow the click-to-purchase funnel
- Ad set and ad creative level performance, including the events each creative drives — which Meta will not show you
- Click-through vs view-through attribution and a re-engagement view, so Google, Meta and Apple stop triple-counting one install
- White-labelled links on app.campussutra.com with deferred deep linking, one link and QR codes, handled on iOS and Android by our team
- Meta catalog / commerce-manager integration so your catalog ads flow into Linkrunner — built for fashion e-commerce
- Conversion postbacks: map your purchase event once and Linkrunner tells Meta in real time to find more buyers, with revenue passed back
- iOS SKAdNetwork dashboard as an Apple SKAN partner, plus an MCP to query your own data straight from Claude

## Questions & Answers
- Will it work with our white-labelled app builder? Yes, not a blocker — we can integrate directly with the app-builder team if needed.
- Does deferred deep linking hold up on iOS? 98%+ on iOS and 99.9% on Android; our integration team audits and handholds the setup.
- How do you handle multi-touch when Google, Meta and Apple all claim the same install? Last-click by default, with click-through and view-through views within a 3 to 5 percent margin of your backend.
- What does it cost? Postpaid and only for attributed installs — organic is free, and the first 25,000 attributed installs are free.
- How hard is integration? A couple of hours of code, much of it done by our AI agents; our team gets you live in about one to two days.

## Why It Matters
- With the app becoming a primary revenue channel, knowing which source drives real buyers, not just installs, is what makes the Meta spend efficient.
- Conversion postbacks alone have cut CPI sharply for similar brands — Playo dropped Google CPI 34%, from 20 to 13 rupees — often paying for the tool itself.
- Postpaid, engineer-led and India-based, so it fits a cost-conscious brand in a growth phase without lock-in.`;

const nextSteps = {
  v: 1,
  config: { showTeamLogos: true },
  steps: [
    {
      id: randomUUID(),
      title: "Share a short deck with the top 3 highlights for Campus Sutra, plus commercials",
      description: "So Kaushik can take it into the internal discussion",
      completed: false,
      date: null,
      teams: ["linkrunner"],
    },
    {
      id: randomUUID(),
      title: "Send app details and current install sources over email",
      description: "",
      completed: false,
      date: null,
      teams: ["customer"],
    },
    {
      id: randomUUID(),
      title: "Review internally and come back with feedback",
      description: "",
      completed: false,
      date: null,
      teams: ["customer"],
    },
  ],
};

async function main() {
  const { data: room, error } = await sb
    .from("rooms")
    .select("id")
    .eq("slug", SLUG)
    .single();
  if (error || !room) throw new Error(`room lookup: ${error?.message ?? "not found"}`);

  const { error: bErr } = await sb
    .from("meeting_briefs")
    .upsert(
      { room_id: room.id, content: CONTENT, next_steps: JSON.stringify(nextSteps) },
      { onConflict: "room_id" }
    );
  if (bErr) throw new Error(`brief upsert: ${bErr.message}`);

  console.log(`Updated brief for /room/${SLUG}`);
  console.log(`  brief: ${CONTENT.length} chars, ${nextSteps.steps.length} next steps`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
