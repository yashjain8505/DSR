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
  loadCompanyContext,
  loadDataAssets,
  loadKnowledgeBase,
  synthesisOf,
  type BaseLayer,
} from "./prompts";

// --- LLM provider selection ------------------------------------------------
// Two providers, picked by which credential is set:
//   1. OpenRouter (OPENROUTER_API_KEY) — OpenAI-compatible gateway, used when
//      set. No Anthropic prompt caching or adaptive thinking on this path.
//   2. Anthropic direct (ANTHROPIC_AUTH_TOKEN subscription OAuth token, else the
//      metered ANTHROPIC_API_KEY) — keeps prompt caching + adaptive thinking.
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

// Anthropic client (used only on the Anthropic path). Auth resolves lazily at
// request time, so building it with no key is safe when OpenRouter is in use.
const authToken = process.env.ANTHROPIC_AUTH_TOKEN;
const anthropic = authToken
  ? new Anthropic({
      authToken,
      defaultHeaders: { "anthropic-beta": "oauth-2025-04-20" },
    })
  : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Model id is provider-specific: OpenRouter uses namespaced slugs
// (`anthropic/claude-haiku-4.5`), the Anthropic API uses bare ids
// (`claude-haiku-4-5`). ENGINE_MODEL overrides either — match it to the provider.
const MODEL = OPENROUTER_KEY
  ? (process.env.ENGINE_MODEL ?? "anthropic/claude-haiku-4.5")
  : (process.env.ENGINE_MODEL ??
    process.env.ANTHROPIC_MODEL ??
    "claude-haiku-4-5");

// 8000 is plenty for the JSON outputs (drafts are short) and keeps per-call cost
// down — it's also within Claude 3.5 Haiku's 8192 output cap on OpenRouter.
const MAX_TOKENS = 8000;

// Adaptive thinking exists only on the 4.6 generation and later, and only on the
// Anthropic-direct path. Haiku 4.5 and older 400 on `thinking: {type:
// "adaptive"}`, so it's gated to models that support it.
const ADAPTIVE_THINKING_MODELS = [
  "claude-opus-4-6",
  "claude-opus-4-7",
  "claude-opus-4-8",
  "claude-sonnet-4-6",
  "claude-fable-5",
];
const USE_ADAPTIVE_THINKING =
  !OPENROUTER_KEY && ADAPTIVE_THINKING_MODELS.some((m) => MODEL.startsWith(m));

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
  context: string | null;
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
// LLM call helpers — return the model's raw text for a (system, user) pair.
// ---------------------------------------------------------------------------
async function anthropicText(system: string, user: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    ...(USE_ADAPTIVE_THINKING
      ? { thinking: { type: "adaptive" as const } }
      : {}),
    // The system prompt embeds the company context + knowledge base — a large
    // stable prefix. Cache it so repeated runs (and the matcher/critic pair
    // within a run window) pay ~0.1x for it. Volatile content (date, signals)
    // stays in the user message, after the breakpoint.
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

async function openRouterText(system: string, user: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENROUTER_KEY}`,
      "X-Title": "Linkrunner Ideation",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 500)}`);
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error(
      `OpenRouter: no text in response: ${JSON.stringify(json).slice(0, 300)}`,
    );
  }
  return text;
}

// ---------------------------------------------------------------------------
// LLM call helper — returns parsed JSON, tolerant of code fences and any prose
// the model wraps around the JSON (slices the outermost {...} / [...] and
// retries if a direct parse fails).
// ---------------------------------------------------------------------------
function extractJson(s: string): string | null {
  const starts = [s.indexOf("{"), s.indexOf("[")].filter((i) => i !== -1);
  if (!starts.length) return null;
  const start = Math.min(...starts);
  const close = s[start] === "{" ? "}" : "]";
  const end = s.lastIndexOf(close);
  return end > start ? s.slice(start, end + 1) : null;
}

async function llmJson(system: string, user: string): Promise<any> {
  const text = OPENROUTER_KEY
    ? await openRouterText(system, user)
    : await anthropicText(system, user);
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const extracted = extractJson(clean);
    if (extracted) return JSON.parse(extracted);
    throw new Error(`LLM did not return parseable JSON: ${clean.slice(0, 200)}`);
  }
}

// ---------------------------------------------------------------------------
// Base layer — the engine_config rows (company context / data assets /
// knowledge base), edited from the admin dashboard. Falls back to the config/
// files per-key when a row is missing (e.g. before migration 010 + seeding).
// ---------------------------------------------------------------------------
async function loadBaseLayer(): Promise<BaseLayer> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("engine_config").select("key, value");
  const map = new Map<string, string>(
    error ? [] : (data ?? []).map((r) => [r.key as string, r.value as string]),
  );
  const knowledgeBase = map.get("knowledge_base") ?? loadKnowledgeBase();
  return {
    companyContext: map.get("company_context") ?? loadCompanyContext(),
    dataAssets: map.get("data_assets") ?? loadDataAssets(),
    knowledgeBase,
    knowledgeBaseSynthesis: synthesisOf(knowledgeBase),
  };
}

// ---------------------------------------------------------------------------
// Turn extracted signals into a readable, editable per-company context block.
// Seeds prospect.context on the first run and on an explicit "regenerate".
// ---------------------------------------------------------------------------
export function formatSignalsAsContext(s: any): string {
  const lines: string[] = [];
  const add = (label: string, val: any) => {
    if (
      val === null ||
      val === undefined ||
      val === "" ||
      (Array.isArray(val) && val.length === 0)
    )
      return;
    lines.push(`- **${label}:** ${Array.isArray(val) ? val.join("; ") : val}`);
  };
  add("Stage", s?.stage);
  add("Current vendor", s?.current_vendor);
  add("Deal size", s?.deal_size_indicator);
  add("Contract end", s?.contract_end_date);
  if (Array.isArray(s?.contacts) && s.contacts.length) {
    lines.push(
      `- **Contacts:** ${s.contacts
        .map(
          (c: any) =>
            `${c.name ?? "?"} (${c.role ?? "?"}, ${c.disposition ?? "?"})`,
        )
        .join("; ")}`,
    );
  }
  if (Array.isArray(s?.objections) && s.objections.length) {
    lines.push(
      `- **Objections:** ${s.objections
        .map((o: any) => o.objection)
        .join("; ")}`,
    );
  }
  add("Positive reactions", s?.positive_reactions);
  add("Open questions", s?.open_questions);
  add("Urgency signals", s?.urgency_signals);
  add("Buying committee gaps", s?.buying_committee_gaps);
  add("Notable specifics", s?.notable_specifics);
  return `# Auto-drafted from meetings — edit freely\n\n${lines.join("\n")}`;
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
  const base = await loadBaseLayer();

  // 0. Prospect facts + transcripts + play library
  const { data: prospect, error: pErr } = await admin
    .from("prospects")
    .select("*")
    .eq("id", prospectId)
    .single<IdeationProspect>();
  if (pErr || !prospect) throw new Error(`No prospect ${prospectId}`);

  const chunks: string[] = [];
  // Curated, human-maintained context is authoritative — put it first.
  if (prospect.context)
    chunks.push(
      `--- Curated company context (human-maintained, authoritative) ---\n${prospect.context}`,
    );
  for (const src of transcripts) chunks.push(...(await src.fetch(prospect)));
  if (prospect.notes) chunks.push(`--- Rep notes ---\n${prospect.notes}`);
  if (!chunks.length)
    throw new Error(
      "No context, transcripts, or notes for this prospect (add curated context, a Granola meeting matched by company name, a transcript, or rep notes).",
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

  // First-time auto-draft of the per-company context from the signals, so the
  // user has something to curate. Never overwrite an existing (edited) context.
  if (!prospect.context) {
    await admin
      .from("prospects")
      .update({ context: formatSignalsAsContext(signals) })
      .eq("id", prospectId);
  }

  // 2a. MATCHER and 2b. CREATIVE in parallel
  const [matched, wildIdeas] = await Promise.all([
    llmJson(
      matcherPrompt(base),
      `Today's date: ${today}\n\nSIGNALS:\n${JSON.stringify(signals, null, 2)}\n\nPLAY LIBRARY:\n${JSON.stringify(plays, null, 2)}`,
    ),
    (async () => {
      const ctx = await webContext.fetch(prospect.company);
      return llmJson(
        creativePrompt(base),
        `Today's date: ${today}\n\nSIGNALS:\n${JSON.stringify(signals, null, 2)}\n\nFRESH CONTEXT:\n${ctx || "(none available)"}`,
      );
    })(),
  ]);

  // 3. CRITIC filters the wild cards
  const critiqued = await llmJson(
    criticPrompt(base),
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
  // Each touch is just the IDEA (what to do) + the why. No send-ready drafts.
  const touches: any[] = [];
  if (signals.mode === "nurture" && matched.timeline) {
    for (const t of matched.timeline) {
      touches.push({
        due: t.due_date,
        type: t.touch_type,
        title: t.idea ?? t.play,
        why: t.why,
        wild: false,
      });
    }
  } else {
    const plays_ = Array.isArray(matched) ? matched : matched.plays;
    for (const p of plays_ ?? []) {
      touches.push({
        due: p.send_when?.match(/^\d{4}-/) ? p.send_when : today,
        type: p.touch_type,
        title: p.idea ?? p.play,
        why: p.why_now,
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
export async function dueThisWeek(days = 7) {
  const admin = createAdminClient();
  const weekOut = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
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
      description: `Promoted wild card. Idea that worked: ${t.title}`,
      triggers: `Worked when: ${t.why}`,
      asset_hint: "see description",
      cost_tier: 0,
      origin: "promoted",
    });
  }
  return t;
}
