// pipeline.ts — ideation engine orchestration, adapted to this stack:
// Supabase (service role) for persistence, the Granola meeting cache as the
// primary transcript source, and the existing Slack webhook for digests.
// Server-only: imports the admin Supabase client. Never import client-side.

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  EXTRACTION_PROMPT,
  matcherPrompt,
  creativePrompt,
  criticPrompt,
} from "./prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL =
  process.env.ENGINE_MODEL ?? process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IdeationProspect {
  id: number;
  company: string;
  contact_name: string | null;
  persona: string | null;
  stage: string;
  deal_size: number | null;
  current_vendor: string | null;
  contract_end_date: string | null;
  room_id: string | null;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Pluggable interfaces with defaults that need nothing extra.
// ---------------------------------------------------------------------------

export interface TranscriptSource {
  fetch(prospect: IdeationProspect): Promise<string[]>;
}

/** The engine's own transcripts table (manual dumps, emails, notes). */
export class InternalStore implements TranscriptSource {
  async fetch(prospect: IdeationProspect): Promise<string[]> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("transcripts")
      .select("meeting_date, title, content")
      .eq("prospect_id", prospect.id)
      .order("meeting_date", { ascending: true, nullsFirst: true });
    if (error) throw new Error(`transcripts: ${error.message}`);
    return (data ?? []).map(
      (r) =>
        `--- Meeting: ${r.title ?? "untitled"} (${r.meeting_date ?? "date unknown"}) ---\n${r.content}`,
    );
  }
}

/**
 * Primary source: the Granola meeting cache this app already syncs.
 * Matches by company name (ilike) so a prospect picks up its meetings
 * without re-entering anything.
 */
export class GranolaSource implements TranscriptSource {
  async fetch(prospect: IdeationProspect): Promise<string[]> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("granola_meeting_cache")
      .select("title, meeting_date, summary")
      .ilike("company_name", `%${prospect.company}%`)
      .order("meeting_date", { ascending: true });
    if (error) throw new Error(`granola_meeting_cache: ${error.message}`);
    return (data ?? [])
      .filter((m) => m.summary)
      .map(
        (m) =>
          `--- Meeting (Granola): ${m.title} (${m.meeting_date}) ---\n${m.summary}`,
      );
  }
}

/** Optional fresh outside-world context. Default is a no-op. */
export interface WebContextProvider {
  fetch(company: string): Promise<string>;
}
export class NoWebContext implements WebContextProvider {
  async fetch(): Promise<string> {
    return "";
  }
}

/** Where the weekly digest goes. Defaults to the room-open Slack webhook. */
export interface NotificationSink {
  send(text: string): Promise<void>;
}
export class ConsoleSink implements NotificationSink {
  async send(text: string) {
    console.log(text);
  }
}
export class WebhookSink implements NotificationSink {
  constructor(private url: string) {}
  async send(text: string) {
    await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  }
}

function defaultNotifier(): NotificationSink {
  const url = process.env.DIGEST_WEBHOOK_URL ?? process.env.SLACK_WEBHOOK_URL;
  return url ? new WebhookSink(url) : new ConsoleSink();
}

export const defaults = {
  transcripts: [new GranolaSource(), new InternalStore()] as TranscriptSource[],
  webContext: new NoWebContext() as WebContextProvider,
};

// ---------------------------------------------------------------------------
// LLM call helper — returns parsed JSON, strips accidental fences.
// ---------------------------------------------------------------------------
async function llmJson(system: string, user: string): Promise<any> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    // The system prompt embeds the company context + knowledge base — a large
    // stable prefix. Cache it so repeated runs (and the matcher/critic pair
    // within a run window) pay ~0.1x for it. Volatile content (date, signals)
    // stays in the user message, after the breakpoint.
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });
  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ---------------------------------------------------------------------------
// THE PIPELINE
// ---------------------------------------------------------------------------
export async function runIdeation(
  prospectId: number,
  deps: Partial<typeof defaults> = {},
) {
  const { transcripts, webContext } = { ...defaults, ...deps };
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  // 0. Prospect facts + transcripts + play library
  const { data: prospect, error: pErr } = await admin
    .from("prospects")
    .select("*")
    .eq("id", prospectId)
    .single<IdeationProspect>();
  if (pErr || !prospect) throw new Error(`No prospect ${prospectId}`);

  const chunks: string[] = [];
  for (const src of transcripts) chunks.push(...(await src.fetch(prospect)));
  if (prospect.notes) chunks.push(`--- Rep notes ---\n${prospect.notes}`);
  if (!chunks.length)
    throw new Error(
      "No transcripts or notes found for this prospect (Granola match by company name, transcripts table, or prospect notes).",
    );
  const dump = chunks.join("\n\n");

  const { data: plays, error: plErr } = await admin
    .from("plays")
    .select("*")
    .eq("active", true);
  if (plErr) throw new Error(`plays: ${plErr.message}`);

  // 1. EXTRACTION
  const signals = await llmJson(
    EXTRACTION_PROMPT,
    `Today's date: ${today}\n\nKnown facts (may be incomplete): ${JSON.stringify({
      company: prospect.company,
      deal_size: prospect.deal_size,
      current_vendor: prospect.current_vendor,
      contract_end_date: prospect.contract_end_date,
    })}\n\nDUMP:\n${dump}`,
  );

  // 2a. MATCHER and 2b. CREATIVE in parallel
  const [matched, wildIdeas] = await Promise.all([
    llmJson(
      matcherPrompt(),
      `Today's date: ${today}\n\nSIGNALS:\n${JSON.stringify(signals, null, 2)}\n\nPLAY LIBRARY:\n${JSON.stringify(plays, null, 2)}`,
    ),
    (async () => {
      const ctx = await webContext.fetch(prospect.company);
      return llmJson(
        creativePrompt(),
        `Today's date: ${today}\n\nSIGNALS:\n${JSON.stringify(signals, null, 2)}\n\nFRESH CONTEXT:\n${ctx || "(none available)"}`,
      );
    })(),
  ]);

  // 3. CRITIC filters the wild cards
  const critiqued = await llmJson(
    criticPrompt(),
    `Today's date: ${today}\n\nSIGNALS:\n${JSON.stringify(signals, null, 2)}\n\nCANDIDATE IDEAS:\n${JSON.stringify(wildIdeas, null, 2)}`,
  );

  // 4. Persist the run
  const output = { matched, wild_cards: critiqued.wild_cards };
  const { data: run, error: rErr } = await admin
    .from("runs")
    .insert({ prospect_id: prospectId, mode: signals.mode, signals, output })
    .select("id")
    .single();
  if (rErr) throw new Error(`runs: ${rErr.message}`);

  // 5. Persist touches
  const touches: any[] = [];
  if (signals.mode === "nurture" && matched.timeline) {
    for (const t of matched.timeline) {
      touches.push({
        due: t.due_date,
        type: t.touch_type,
        title: t.play,
        why: t.why,
        draft: t.draft,
        wild: false,
      });
    }
  } else {
    const plays_ = Array.isArray(matched) ? matched : matched.plays;
    for (const p of plays_ ?? []) {
      touches.push({
        due: p.send_when?.match(/^\d{4}-/) ? p.send_when : today,
        type: p.touch_type,
        title: p.play,
        why: p.why_now,
        draft: p.draft,
        wild: false,
      });
    }
  }
  for (const w of critiqued.wild_cards ?? []) {
    touches.push({
      due: w.send_when?.match(/^\d{4}-/) ? w.send_when : today,
      type: w.touch_type,
      title: w.idea,
      why: w.built_on,
      draft: w.draft,
      wild: true,
    });
  }

  if (touches.length > 0) {
    const { error: tErr } = await admin.from("touches").insert(
      touches.map((t) => ({
        prospect_id: prospectId,
        run_id: run.id,
        due_date: t.due,
        touch_type: t.type ?? "other",
        title: t.title,
        why: t.why,
        draft: t.draft,
        is_wild_card: t.wild,
      })),
    );
    if (tErr) throw new Error(`touches: ${tErr.message}`);
  }

  return { runId: run.id, signals, ...output };
}

// ---------------------------------------------------------------------------
// "Due this week" — the Monday morning view.
// ---------------------------------------------------------------------------
export async function dueThisWeek() {
  const admin = createAdminClient();
  const weekOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const { data, error } = await admin
    .from("touches")
    .select("*, prospects:prospect_id(company)")
    .eq("status", "pending")
    .lte("due_date", weekOut)
    .order("due_date", { ascending: true });
  if (error) throw new Error(`touches: ${error.message}`);
  return data ?? [];
}

export async function sendWeeklyDigest(
  notifier: NotificationSink = defaultNotifier(),
) {
  const due = await dueThisWeek();
  if (!due.length) {
    await notifier.send("Ideation engine: nothing due this week.");
    return { sent: 0 };
  }
  const lines = due.map(
    (t: any) =>
      `• ${t.due_date} — ${t.prospects?.company ?? "?"}: ${t.title}${t.is_wild_card ? " [wild card]" : ""} (draft ready)`,
  );
  await notifier.send(`Touches due this week:\n${lines.join("\n")}`);
  return { sent: due.length };
}

// ---------------------------------------------------------------------------
// Feedback loop: record outcome; promote winning wild cards into the library.
// ---------------------------------------------------------------------------
export async function recordOutcome(
  touchId: number,
  status: "sent" | "skipped",
  outcome?: "reply" | "no_reply" | "meeting_booked",
) {
  const admin = createAdminClient();
  const { data: t, error } = await admin
    .from("touches")
    .update({
      status,
      outcome: outcome ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", touchId)
    .select()
    .single();
  if (error) throw new Error(`touches: ${error.message}`);

  if (
    t?.is_wild_card &&
    (outcome === "reply" || outcome === "meeting_booked")
  ) {
    await admin.from("plays").insert({
      name: String(t.title).slice(0, 80),
      description: `Promoted wild card. Draft that worked:\n${t.draft}`,
      triggers: `Worked when: ${t.why}`,
      asset_hint: "see description",
      cost_tier: 0,
      origin: "promoted",
    });
  }
  return t;
}
