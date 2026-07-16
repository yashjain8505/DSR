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
      max_tokens: 4096,
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

function fallbackBrief(
  transcript: string,
  opts: { contactName?: string | null; meetingDate?: string | null },
): BriefFromTranscript {
  const snap = ["## Meeting Summary"];
  if (opts.meetingDate) snap.push(`Date: ${opts.meetingDate}`);
  if (opts.contactName) snap.push(`Attendees: ${opts.contactName}`);
  const content = `${snap.join("\n")}\n\n## Notes\n${transcript.trim()}`;
  return { content, nextSteps: "" };
}

/**
 * Generate the structured, customer-POV brief from a raw transcript.
 * Always resolves (never throws) so it can't fail room creation.
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
  if (!text) return { content: "", nextSteps: "" };

  if (!hasCredential()) return fallbackBrief(text, opts);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);

  try {
    const userParts = [`Company: ${opts.companyName}`];
    if (opts.contactName) userParts.push(`Prospect attendee(s): ${opts.contactName}`);
    if (opts.meetingDate) userParts.push(`Meeting date: ${opts.meetingDate}`);
    userParts.push("", "TRANSCRIPT:", text);

    const out = (await callLLM(SYSTEM_PROMPT, userParts.join("\n"), controller.signal))
      .trim()
      .replace(/^```(?:markdown)?\n?/, "")
      .replace(/\n?```$/, "");

    if (!out) return fallbackBrief(text, opts);

    // Split next steps out, then normalize the recap to canonical sections so it
    // renders exactly like every other room's brief.
    const split = splitBrief(out);
    const nextSteps = split.nextSteps;
    let content = split.content;
    const parsed = parseBrief(content);
    if (hasStructure(parsed)) content = serializeBrief(parsed);
    return { content, nextSteps };
  } catch (err) {
    console.warn("[brief-from-transcript] LLM failed; using verbatim fallback.", err);
    return fallbackBrief(text, opts);
  } finally {
    clearTimeout(timer);
  }
}
