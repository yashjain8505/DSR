/**
 * Turn a RAW meeting transcript into the structured, customer-facing meeting
 * brief the room renders ("What we discussed so far": Your Situation / Pain
 * Points / What We Showed You / Questions & Answers / Next Steps).
 *
 * Provider is GROQ_API_KEY only (Groq — free, OpenAI-compatible). No Anthropic,
 * no OpenRouter, and never a Claude subscription OAuth token (those 401 on direct
 * API calls — they only work inside Claude Code).
 *
 * Fallback (no key / empty / error): the transcript is kept verbatim under a
 * Notes heading so nothing is lost and room creation never fails. Output is
 * normalized through the same parseBrief/serializeBrief the from-granola flow
 * uses, so it renders identically. Server-only — never import into client code.
 */
import { parseBrief, hasStructure, serializeBrief } from "./meeting-brief";

const SYSTEM_PROMPT = `You are turning a raw sales-call transcript into a structured recap that the CUSTOMER will read inside their sales room, under a heading "What we discussed so far". Write it as if the customer is reading it.

GROUNDING (most important):
- Use ONLY information explicitly stated in the transcript. Do NOT infer, speculate, generalize, or invent anything. An inaccurate detail is far worse than a missing one.
- Every company name, person, number, metric, integration, and product name must match the transcript exactly.
- If a section has no real supporting content in the transcript, OMIT that section entirely. Never pad with boilerplate or assumed content.

STRUCTURE (Markdown):
- Start with a snapshot block:
  ## Meeting Summary
  Date: <the meeting date if known, else omit this line>
  Attendees: <the prospect/customer attendees only>
- Then include only the sections that have real content, using these EXACT headings and this order:
  ## Your Situation      (their current setup, tools, scale, goals)
  ## Pain Points         (problems / frustrations they raised)
  ## What We Showed You   (what Linkrunner demoed / covered)
  ## Questions & Answers  (concrete Q&A, only if present)
  ## Next Steps          (agreed follow-ups / action items)
- Use "- " bulleted items under each heading.

STYLE:
- Second person ("you", "your"). Never refer to the customer in the third person or by company name as the subject of analysis.
- Do NOT include any pricing or cost figures. Pricing lives in a separate tab.
- In Attendees, list only the prospect's team. Remove all Linkrunner people (Yash, Shreyans, Lakshith, anyone @linkrunner.io).
- Do not use em-dashes or en-dashes; use a hyphen with spaces ( - ).
- Keep "Linkrunner" as the product name. Confident, warm, concise.
- Output ONLY the Markdown brief. No preamble, no explanation, no code fences.`;

export interface BriefFromTranscript {
  content: string;
  nextSteps: string;
}

function hasCredential(): boolean {
  return !!process.env.GROQ_API_KEY;
}

function pickModel(): string {
  return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
}

/** Call Groq for a (system, user) pair; returns raw text. Throws on failure. */
async function callLLM(system: string, user: string, signal: AbortSignal): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error("no LLM credential (set GROQ_API_KEY)");

  // Groq is OpenAI-compatible: system + user in one messages array.
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    cache: "no-store",
    signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: pickModel(),
      // Groq bills max_tokens against the tokens-per-minute budget UP FRONT, so
      // this number is a rate-limit knob, not just an output cap. On the free
      // on-demand tier (12,000 TPM) a ~30k-char transcript is ~8.2k input
      // tokens; with max_tokens at 4096 the request totalled 12,269 and Groq
      // rejected it with a 413 — intermittently, since it depends on what else
      // ran that minute. That intermittency is what published a raw transcript
      // to a prospect on 3 Aug 2026.
      // Real briefs land around 1.2k characters (~300 tokens), so 1536 is ample
      // headroom and keeps the whole request near 9.7k, comfortably inside the
      // budget.
      max_tokens: 1536,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("Groq: empty response");
  return text;
}

/** Split a structured brief markdown into recap content + the next-steps block. */
export function splitBrief(brief: string): BriefFromTranscript {
  const lines = (brief ?? "").replace(/\r\n/g, "\n").split("\n");
  const contentLines: string[] = [];
  const nextLines: string[] = [];
  let inNext = false;
  for (const l of lines) {
    if (/^\s*#{1,4}\s*Next Steps\s*:?\s*$/i.test(l)) {
      inNext = true;
      continue;
    }
    (inNext ? nextLines : contentLines).push(l);
  }
  const content = contentLines.join("\n").trim();
  const nextSteps = nextLines
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => l.replace(/^[*]\s+/, "- "))
    .join("\n");
  return { content, nextSteps };
}

/**
 * What we store when the LLM can't produce a brief: nothing.
 *
 * This brief is PROSPECT-FACING. Until Aug 2026 the fallback pasted the raw
 * transcript in verbatim under a "## Notes" heading, so a single transient Groq
 * error published our entire unedited conversation to the customer — internal
 * asides, half-sentences, our own pitch played back at them. That happened in
 * production (two rooms, 3 Aug 2026).
 *
 * An empty brief is strictly better: the caller hides the Recap tab when it
 * gets one, so the room simply has no recap instead of a leaked transcript.
 * The transcript is never lost — it stays with the source (Granola / the
 * admin's paste) and the brief can be regenerated.
 */
function emptyBrief(): BriefFromTranscript {
  return { content: "", nextSteps: "" };
}

/** One retry on a failed generation. */
const ATTEMPTS = 2;

/**
 * Cap on transcript characters sent to Groq.
 *
 * The free on-demand tier allows 12,000 tokens per minute and counts
 * input + max_tokens together, up front. Groq's own accounting works out at
 * ~3.5 chars/token on these transcripts, so 32k chars is ~9.1k tokens; plus the
 * system prompt and 1,536 output tokens that lands near 11.2k — inside the
 * budget with room to spare.
 *
 * Without this, any transcript past ~30k chars fails EVERY time (a 41k-char
 * one needs ~13.3k tokens), which is not a flake but a hard ceiling.
 */
const MAX_TRANSCRIPT_CHARS = 32_000;

/**
 * Trim an over-long transcript from the MIDDLE, keeping both ends.
 *
 * The opening carries who they are and why they took the call; the close
 * carries commitments and next steps. Truncating the tail — the obvious
 * implementation — throws away exactly the part the brief's "Next Steps"
 * section is built from.
 */
function fitTranscript(text: string): string {
  if (text.length <= MAX_TRANSCRIPT_CHARS) return text;
  const head = Math.floor(MAX_TRANSCRIPT_CHARS * 0.6);
  const tail = MAX_TRANSCRIPT_CHARS - head;
  return (
    text.slice(0, head) +
    "\n\n[... middle of the transcript omitted for length ...]\n\n" +
    text.slice(-tail)
  );
}

/**
 * Generate the structured, customer-POV brief from a raw transcript.
 * Always resolves (never throws) so it can't fail room creation.
 *
 * On failure it returns an EMPTY brief, never the transcript — see emptyBrief().
 * The one observed production failure was transient, so a lost brief is usually
 * recoverable by simply asking again; hence ATTEMPTS.
 */
export async function generateBriefFromTranscript(
  transcript: string,
  opts: {
    companyName: string;
    contactName?: string | null;
    meetingDate?: string | null;
  },
): Promise<BriefFromTranscript> {
  const text = (transcript ?? "").trim();
  if (!text) return emptyBrief();

  if (!hasCredential()) {
    console.error(
      "[brief-from-transcript] GROQ_API_KEY missing — storing an empty brief. " +
        "The room will have no Recap tab until the brief is regenerated.",
    );
    return emptyBrief();
  }

  const userParts = [`Company: ${opts.companyName}`];
  if (opts.contactName) userParts.push(`Prospect attendee(s): ${opts.contactName}`);
  if (opts.meetingDate) userParts.push(`Meeting date: ${opts.meetingDate}`);
  userParts.push("", "TRANSCRIPT:", fitTranscript(text));
  const user = userParts.join("\n");

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    try {
      const out = (await callLLM(SYSTEM_PROMPT, user, controller.signal))
        .trim()
        .replace(/^```(?:markdown)?\n?/, "")
        .replace(/\n?```$/, "");

      if (!out) throw new Error("empty completion");

      // Split next steps out, then normalize the recap to canonical sections so it
      // renders exactly like every other room's brief.
      const split = splitBrief(out);
      const nextSteps = split.nextSteps;
      let content = split.content;
      const parsed = parseBrief(content);
      if (hasStructure(parsed)) content = serializeBrief(parsed);
      return { content, nextSteps };
    } catch (err) {
      const last = attempt === ATTEMPTS;
      console[last ? "error" : "warn"](
        `[brief-from-transcript] attempt ${attempt}/${ATTEMPTS} failed` +
          (last ? " — storing an empty brief (transcript is NOT published)." : ", retrying."),
        err,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  return emptyBrief();
}
