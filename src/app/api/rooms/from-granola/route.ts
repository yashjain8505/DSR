import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/utils";
import {
  OVERVIEW_SUB_TAB_KEYS,
  OVERVIEW_SUB_TAB_LABELS,
  OVERVIEW_SUB_TAB_SORT_ORDER,
  TRUST_PAGE_URL,
  DEFAULT_CUSTOMER_REFERENCES,
  DEFAULT_CASE_STUDIES,
} from "@/lib/constants";
import { extractBrandAssets, domainFromEmail, domainFromSlug } from "@/lib/brand-colors";
import { parseBrief, hasStructure, serializeBrief } from "@/lib/meeting-brief";
import type { GranolaMeetingCache, GranolaMeetingParticipant } from "@/lib/types";

// This route makes an external LLM call (customer-POV brief rewrite) on top of a
// brand-asset fetch and several DB writes, so give it generous execution
// headroom. Deployment platforms cap this to their plan limit — it's advisory.
// (Next.js route segment config.)
export const maxDuration = 30;

/**
 * POST /api/rooms/from-granola
 * Creates a new room from a cached Granola meeting.
 *
 * Body: { granola_cache_id: string }
 *
 * Automatically populates:
 * - Room: company_name, contact_name, contact_email, slug
 * - Meeting brief: summary content from Granola
 * - All other child tables: seeded with defaults
 */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body: { granola_cache_id: string } = await request.json();

    if (!body.granola_cache_id) {
      return NextResponse.json(
        { error: "granola_cache_id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Fetch the cached Granola meeting
    const { data: meetingData, error: meetingError } = await admin
      .from("granola_meeting_cache")
      .select("*")
      .eq("id", body.granola_cache_id)
      .single();

    if (meetingError || !meetingData) {
      return NextResponse.json(
        { error: "Granola meeting not found in cache" },
        { status: 404 }
      );
    }

    const meeting = meetingData as GranolaMeetingCache;

    // 2. Extract prospect info from participants
    const participants = meeting.participants as GranolaMeetingParticipant[];
    const prospects = findProspectContacts(participants);
    const prospect = prospects[0] ?? null;
    const companyName = meeting.company_name || prospect?.company || "Unknown";

    // Every external attendee's email, deduped. These are auto-granted access
    // to the room below, so an admin never has to invite them by hand.
    const attendeeEmails = Array.from(
      new Set(
        prospects
          .map((p) => p.email?.trim().toLowerCase())
          .filter(
            (e): e is string =>
              !!e && e.includes("@") && !e.endsWith("@linkrunner.io")
          )
      )
    );

    // 3. Extract brand assets (logo + color) from prospect's website
    let brandColor: string | null = null;
    let secondaryColor: string | null = null;
    let logoUrl: string | null = null;
    const contactEmail = meeting.contact_email ?? prospect?.email;

    // Try email domain first, then guess domain from company name
    let domain: string | null = null;
    if (contactEmail) {
      domain = domainFromEmail(contactEmail);
    }
    if (!domain) {
      domain = await domainFromSlug(companyName);
    }
    if (domain) {
      try {
        const assets = await extractBrandAssets(domain);
        brandColor = assets.brandColor;
        logoUrl = assets.logoUrl;
        secondaryColor = assets.secondaryColor;
      } catch {
        /* brand extraction is best-effort */
      }
    }
    // No extra fallback — extractBrandAssets ends with a validated
    // Google-favicon attempt; null renders as a monogram instead of a 404.

    // 4. Generate a unique slug
    let slug = generateSlug(companyName);
    const { data: existingSlugs } = await admin
      .from("rooms")
      .select("slug")
      .ilike("slug", `${slug}%`);

    if (existingSlugs && existingSlugs.length > 0) {
      slug = `${slug}-${existingSlugs.length + 1}`;
    }

    // 5. Create the room
    const { data: room, error: roomError } = await admin
      .from("rooms")
      .insert({
        slug,
        company_name: companyName,
        contact_name: prospects.length > 0
          ? prospects.map((p) => p.name).join(", ")
          : null,
        contact_email: meeting.contact_email ?? prospect?.email ?? null,
        logo_url: logoUrl,
        brand_primary_color: brandColor,
        brand_secondary_color: secondaryColor,
        // Lock the room to its meeting attendees (seeded below). We only
        // restrict when there is at least one attendee to admit, so a room
        // with no external attendees is never accidentally sealed shut.
        restrict_access: attendeeEmails.length > 0,
      })
      .select()
      .single();

    if (roomError) {
      return NextResponse.json(
        { error: roomError.message },
        { status: 500 }
      );
    }

    const roomId = room.id;

    // 6. Build meeting brief content — prefer structured brief, fall back to raw summary
    const rawBrief = meeting.meeting_brief
      ? meeting.meeting_brief
      : buildBriefContent(meeting, participants);

    // Split structured brief into recap content and next steps, then rewrite the
    // recap into the customer's POV. rewriteBriefForCustomer uses an LLM when
    // ANTHROPIC_API_KEY is set and falls back to a deterministic scrub otherwise,
    // so the prospect never reads internal triage language in "What we discussed".
    const { content: rawContent, nextSteps } = splitBriefContent(rawBrief);
    let briefContent = await rewriteBriefForCustomer(rawContent);

    // Normalize to canonical section headers ("Your Situation", "Questions &
    // Answers", ...) so every room renders the structured recap format,
    // whether or not the LLM rewrite ran. Unparseable briefs stay as-is.
    const parsedBrief = parseBrief(briefContent);
    if (hasStructure(parsedBrief)) {
      briefContent = serializeBrief(parsedBrief);
    }

    // 7. Create all child rows in parallel
    const [briefResult, subTabsResult, pricingResult, gettingStartedResult, refsResult, caseStudiesResult] =
      await Promise.all([
        admin.from("meeting_briefs").insert({
          room_id: roomId,
          content: briefContent,
          next_steps: nextSteps,
        }),

        admin.from("overview_sub_tabs").insert(
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

        admin.from("pricing").insert({
          room_id: roomId,
          content: "",
        }),

        admin.from("getting_started").insert({
          room_id: roomId,
          integration_timeline: "",
          migration_steps: "",
          onboarding_plan: "",
        }),

        admin.from("customer_references").insert(
          DEFAULT_CUSTOMER_REFERENCES.map((ref, i) => ({
            room_id: roomId,
            name: ref.name,
            logo_url: ref.logo_url,
            is_visible: true,
            sort_order: i,
          }))
        ),

        admin.from("case_studies").insert(
          DEFAULT_CASE_STUDIES.map((cs, i) => ({
            room_id: roomId,
            title: cs.title,
            customer_name: cs.customer_name,
            customer_logo_url: cs.customer_logo_url,
            banner_url: cs.banner_url,
            url: cs.url,
            content: cs.content,
            sort_order: i,
          }))
        ),
      ]);

    // Check for child insert errors
    const childErrors = [
      briefResult.error,
      subTabsResult.error,
      pricingResult.error,
      gettingStartedResult.error,
      refsResult.error,
      caseStudiesResult.error,
    ].filter(Boolean);

    if (childErrors.length > 0) {
      await admin.from("rooms").delete().eq("id", roomId);
      return NextResponse.json(
        {
          error: "Failed to create room content",
          details: childErrors.map((e) => e!.message),
        },
        { status: 500 }
      );
    }

    // 8. Auto-grant access to every meeting attendee. Best-effort: a failure
    // here must not fail room creation (the room already exists and the admin
    // can still invite emails manually). restrict_access was set above.
    if (attendeeEmails.length > 0) {
      const { error: accessError } = await admin
        .from("room_access")
        .insert(attendeeEmails.map((email) => ({ room_id: roomId, email })));
      if (accessError) {
        console.warn(
          `[from-granola] failed to seed room_access for ${slug}: ${accessError.message}`
        );
      }
    }

    return NextResponse.json(
      {
        room,
        message: `Room created for ${companyName} with meeting brief populated from Granola. ${attendeeEmails.length} attendee(s) auto-granted access.`,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */

/**
 * Find ALL prospect contacts (non-Linkrunner participants).
 * Returns them in the order they appear in the participants list.
 */
function findProspectContacts(
  participants: GranolaMeetingParticipant[]
): GranolaMeetingParticipant[] {
  return participants.filter(
    (p) =>
      !p.is_creator &&
      !p.email?.endsWith("@linkrunner.io") &&
      p.name !== "Shreyans" &&
      p.name !== "Lakshith"
  );
}

/**
 * Build formatted meeting brief markdown from Granola meeting data.
 */
function buildBriefContent(
  meeting: GranolaMeetingCache,
  participants: GranolaMeetingParticipant[]
): string {
  const lines: string[] = [];

  lines.push(`# ${meeting.title}`);
  lines.push("");
  lines.push(
    `**Date:** ${new Date(meeting.meeting_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
  );
  lines.push("");

  // Prospect participants only
  const prospects = participants.filter(
    (p) =>
      !p.is_creator &&
      !p.email?.endsWith("@linkrunner.io") &&
      p.name !== "Shreyans" &&
      p.name !== "Lakshith"
  );

  if (prospects.length > 0) {
    const names = prospects
      .map((p) => {
        const parts = [p.name];
        if (p.company) parts.push(`(${p.company})`);
        if (p.email) parts.push(`— ${p.email}`);
        return parts.join(" ");
      })
      .join(", ");
    lines.push(`**Participants:** ${names}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  if (meeting.summary) {
    lines.push(meeting.summary);
  } else {
    lines.push(
      "*No meeting summary available. Add notes manually or re-sync from Granola.*"
    );
  }

  return lines.join("\n");
}

/**
 * Split a structured meeting brief into main recap content and next steps.
 *
 * Looks for a "NEXT STEPS" section and a "READINESS" line.
 * Everything before NEXT STEPS becomes the recap content.
 * The NEXT STEPS block (without the READINESS tag) becomes next_steps.
 */
function splitBriefContent(brief: string): {
  content: string;
  nextSteps: string;
} {
  // Find the NEXT STEPS section — supports both ALL CAPS and markdown headings:
  //   "NEXT STEPS", "### Next Steps", "## Next Steps", "**Next Steps**"
  const nextStepsMatch = brief.match(
    /\n((?:#{1,4}\s*)?(?:\*{1,2})?NEXT STEPS(?:\*{1,2})?\s*:?\s*\n[\s\S]*?)(?=\nREADINESS:|$)/i
  );

  if (!nextStepsMatch) {
    // No next steps section found — strip READINESS line and return all as content
    const cleaned = brief.replace(/\nREADINESS:[\s\S]*$/i, "").trim();
    return { content: cleaned, nextSteps: "" };
  }

  const nextStepsRaw = nextStepsMatch[1].trim();
  // Strip the heading line, keep the bullet items
  const nextStepsBody = nextStepsRaw
    .replace(/^(?:#{1,4}\s*)?(?:\*{1,2})?NEXT STEPS(?:\*{1,2})?\s*:?\s*/i, "")
    .trim();

  // Content is everything before the NEXT STEPS section, without READINESS
  const contentEnd = brief.indexOf(nextStepsMatch[0]);
  const content = brief
    .slice(0, contentEnd)
    .replace(/\nREADINESS:[\s\S]*$/i, "")
    .trim();

  return { content, nextSteps: nextStepsBody };
}

/**
 * Deterministic scrub of internal sales-triage language. The Granola-sourced
 * brief is written for internal triage (third person, blunt qualifiers, ALL-CAPS
 * template headers), but the prospect reads this in the "What we discussed so
 * far" tab. This runs as the FALLBACK whenever the LLM rewrite is unavailable.
 * It only touches an exact, safe set of patterns — it deliberately does NOT
 * rewrite third-person prose, because blind pronoun swaps corrupt legitimate
 * references (e.g. "Meta handles deduplication on their end").
 */
function sanitizeBriefForCustomer(content: string): string {
  let out = content;

  // Normalize the known internal ALL-CAPS template headers to customer-facing
  // titles. Anchored to whole header lines (tolerating leading #/** decoration
  // and a trailing colon) so inline mentions inside prose are left untouched.
  const headerRewrites: Array<[string, string]> = [
    ["their situation", "Your Situation"],
    ["pain points discussed", "Pain Points"],
    ["pain points", "Pain Points"],
    ["what we showed them", "What We Showed You"],
    ["their questions", "Questions & Answers"],
    ["pricing discussed", "Pricing"],
  ];
  for (const [from, to] of headerRewrites) {
    const re = new RegExp(
      `^(\\s*#{0,6}\\s*\\**\\s*)${from}(\\s*\\**\\s*:?\\s*)$`,
      "gim"
    );
    out = out.replace(re, `$1${to}$2`);
  }

  return (
    out
      // "Very high volume (3.5M in ~6 months)" -> "3.5M in ~6 months": keep the
      // concrete number, drop the qualifier a prospect reads as "Linkrunner
      // can't handle our scale".
      .replace(/\b(?:very|extremely)\s+high\s+volume\s*\(([^)]+)\)/gi, "$1")
      // Bare "very/extremely high volume" -> neutral, flattering phrasing.
      .replace(/\b(?:very|extremely)\s+high\s+volume\b/gi, "significant scale")
      // Third-person volume framing -> second person.
      .replace(/\bat their volume\b/gi, "at your volume")
      .trim()
  );
}

const CUSTOMER_POV_SYSTEM_PROMPT = `You are editing an internal sales-meeting brief so it can be shown to the customer in a "What we discussed so far" recap inside their sales room. Rewrite it so it reads as if the customer is reading it.

GROUNDING (most important):
- Use ONLY information explicitly stated in the brief provided. Do NOT add context, infer motivations, speculate about goals, generalize, or "fill in" anything that is not written. An inaccurate detail is far worse than a missing one.
- Do not change the meaning of any statement. When unsure how to phrase something, keep the original wording.
- If a section has little or no supporting content in the source, OMIT that section entirely. Never pad a section with invented detail, assumed pain points, or boilerplate.
- Every company name, person, number, metric, integration, and product name must match the source exactly. Do not invent or alter any of them.

STYLE:
- Write in the second person ("you", "your"). Never refer to the customer in the third person ("they", "their", "the customer", or the company name as the subject of analysis).
- Do NOT include any pricing information, pricing sections, or cost/pricing figures. Pricing is handled in a separate tab.
- In the attendees/participants line, only list the prospect's team. Remove all Linkrunner team members (Shreyans, Lakshith, Yash, etc.).
- Do not use em-dashes or en-dashes. Use a hyphen with spaces ( - ) instead.
- Keep it well-structured in Markdown. Use warm, customer-facing section headings such as: Your Situation, Pain Points, What We Showed You, Questions & Answers, Security & Compliance, Next Steps. Map internal headings ("THEIR SITUATION", "WHAT WE SHOWED THEM", "THEIR QUESTIONS", etc.) onto these. Only include a heading if the source has real content for it.
- Remove internal sales-triage language and any qualifier that could read as doubt about handling the customer's scale. Never use phrases like "very high volume" or "extremely high volume" — state scale with the concrete numbers only (e.g. "3.5M downloads in ~6 months").
- Keep "Linkrunner" as the product name. Keep the tone confident, warm, and concise.
- Output ONLY the rewritten Markdown brief. No preamble, no explanation, no code fences.`;

/**
 * Rewrite a meeting-brief recap into the customer's point of view.
 *
 * Primary path: an Anthropic LLM call (plain fetch — no SDK dependency added),
 * gated on ANTHROPIC_API_KEY. This fixes third-person prose, internal headers,
 * and tone in one pass. Fallback: the deterministic sanitizeBriefForCustomer
 * scrub — used when no key is set, the brief is empty, the request errors, or it
 * times out. The function therefore always returns safe, customer-readable
 * content and never throws (so it can't fail room creation).
 *
 * Set ANTHROPIC_MODEL to a model your account supports; the default is a fast,
 * low-cost model that is more than enough for this short rewrite.
 */
async function rewriteBriefForCustomer(content: string): Promise<string> {
  const sanitized = sanitizeBriefForCustomer(content);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !sanitized.trim()) return sanitized;

  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: CUSTOMER_POV_SYSTEM_PROMPT,
        messages: [{ role: "user", content: sanitized }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn(
        `[from-granola] brief rewrite failed (${res.status}); using deterministic fallback. ${detail}`.trim()
      );
      return sanitized;
    }

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = (data.content ?? [])
      .map((block) => (block.type === "text" ? block.text ?? "" : ""))
      .join("")
      .trim();

    return text || sanitized;
  } catch (err) {
    console.warn(
      "[from-granola] brief rewrite errored; using deterministic fallback.",
      err
    );
    return sanitized;
  } finally {
    clearTimeout(timer);
  }
}
