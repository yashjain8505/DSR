#!/usr/bin/env npx tsx
/**
 * Update the PayMe India room after the 22 Jul 2026 follow-up call
 * ("Linkrunner <> Anah || Intro call").
 *
 * This is the second call — the room's existing recap is the 7 Jul intro with
 * Vaibhav Tripathi, whose next step was "she will share with VP before the next
 * call". This IS that call. The Recap tab reads "what we discussed so far", so
 * the brief is MERGED, not replaced: the 7 Jul situation / pain points / demo
 * stand, and the 22 Jul outcomes are folded in (confirmed ~2M inorganic
 * installs/mo, iOS SKAdNetwork, audience retargeting, AI integration agent, and
 * the postpaid / no-lock-in commercial model).
 *
 * The transcript was recorded on a personal account and pasted in by hand; it is
 * heavily garbled by speech-to-text and opens with unrelated internal chatter
 * (KheloMore onboarding, meeting-intent asides), so the brief is written from it
 * rather than generated. Hard pricing numbers stay out of the recap by design —
 * parseBrief strips any /pric/i section, and pricing has its own tab.
 *
 * Also fixes contact_name "Vaibhav Tripathi, Anahfatima Int" (a garbled Granola
 * label) -> "Vaibhav Tripathi, Anah Fatima", so the hero greeting reads
 * "Dear Vaibhav, Anah & PayMe India team,".
 *
 * Run from the linkrunner-dsr root:  npx --yes tsx scripts/granola/update-payme-followup.ts
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

const SLUG = "payme-india";
const CONTACT_NAME = "Vaibhav Tripathi, Anah Fatima";

const CONTENT = `## Meeting Summary
Date: July 7 & July 22, 2026
Attendees: Vaibhav Tripathi, Anah Fatima, Avdhesh Shishodia

## Your Situation
- Running roughly 2 million inorganic app installs per month
- Currently on AppsFlyer under a 6-month contract
- Google Analytics and Mixpanel already in place for analytics

## Pain Points
- Raw data needs manual work before it is actionable — "very chaotic and time taking"
- Support over email threads is slow
- Pricing is a concern at your install volume

## What We Showed You
- AI integration agent: your tech team goes live in 5 to 10 minutes, against 4 to 6 weeks with legacy MMPs
- One dashboard for clicks, installs, signups and revenue — daily and monthly, split by organic, iOS, Android or total
- Every acquisition channel with clicks, installs, signups, uninstalls, D7/D14/D30 retention, revenue, spend and suspicious installs
- Custom events like KYC complete and purchase complete, tracked per channel, campaign, ad set and ad creative
- Campaign drill-down to the user level, with the full click-to-subscription drop-off funnel
- White-labelled links on app.paymeindia.com with deferred deep linking, one link and QR codes
- iOS SKAdNetwork dashboard as an Apple SKAN partner: installs and reinstalls by campaign
- Audience builder: cohort users by action, e.g. did not complete purchase, and export to Google or Meta for retargeting
- Integrations across the major ad networks and analytics (Mixpanel, MoEngage, CleverTap), plus 50 to 60 Indian affiliate partners

## Questions & Answers
- Can we keep Mixpanel? Yes — attribution data feeds straight into it, and the audience and funnel tools reduce how much you need to lean on it.
- What is the commercial model? Postpaid and monthly, no lock-in contract and no upfront payment — the only attribution platform offering postpaid. Custom pricing for your volume was shared by email.
- What about organic installs? Included free, so you only pay for the paid installs that matter.

## Why It Matters
- At ~2 million installs a month, a materially lower cost and a postpaid model change the economics versus AppsFlyer.
- Engineer-led support in your timezone means integration and issues are handled directly, not through an email queue.`;

const nextSteps = {
  v: 1,
  config: { showTeamLogos: true },
  steps: [
    {
      id: randomUUID(),
      title: "Share the deck, video demo and custom commercial pricing by email",
      description: "",
      completed: false,
      date: null,
      teams: ["linkrunner"],
    },
    {
      id: randomUUID(),
      title: "Review internally and come back with a plan",
      description: "Anah to revert within 2 to 3 days",
      completed: false,
      date: null,
      teams: ["customer"],
    },
    {
      id: randomUUID(),
      title: "Align on commercials and kick off integration with the AI agent (~10 minutes)",
      description: "",
      completed: false,
      date: null,
      teams: ["linkrunner", "customer"],
    },
  ],
};

async function main() {
  const { data: room, error } = await sb
    .from("rooms")
    .select("id, slug, contact_name")
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

  const { error: rErr } = await sb
    .from("rooms")
    .update({ contact_name: CONTACT_NAME })
    .eq("id", room.id);
  if (rErr) throw new Error(`contact update: ${rErr.message}`);

  console.log(`Updated /room/${SLUG}`);
  console.log(`  contact_name: "${room.contact_name}" -> "${CONTACT_NAME}"`);
  console.log(`  brief: ${CONTENT.length} chars, ${nextSteps.steps.length} next steps`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
