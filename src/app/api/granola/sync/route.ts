import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { timingSafeEqual } from "crypto";

/**
 * Granola public API base URL.
 * (api.granola.ai does not exist — only public-api.granola.ai does.)
 *
 * Keys come from GRANOLA_API_KEYS: one personal API key per rep, so each
 * rep's own meetings sync with no per-meeting filing step. Personal keys
 * carry the "Personal notes" scope, which exposes everything that rep
 * records — see isProspectMeeting() for the filter that keeps internal
 * and personal notes out of the cache.
 */
const GRANOLA_API = "https://public-api.granola.ai/v1";

/** Transcript fetches per batch, and the pause between batches (429 defence). */
const TRANSCRIPT_BATCH_SIZE = 5;
const BATCH_PAUSE_MS = 250;

export const maxDuration = 60;

interface GranolaKey {
  /** Human label for diagnostics — never the key itself. */
  label: string;
  key: string;
}

/**
 * Parse GRANOLA_API_KEYS: a comma-separated list, each entry either a bare
 * key or `label:key` (e.g. "yash:grn_abc,riya:grn_def"). Falls back to the
 * legacy single-key GRANOLA_API_KEY so existing deployments keep working.
 */
function loadKeys(): GranolaKey[] {
  const multi = process.env.GRANOLA_API_KEYS?.trim();
  const raw = multi || process.env.GRANOLA_API_KEY?.trim() || "";

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, i) => {
      const sep = entry.indexOf(":");
      if (sep === -1) return { label: `key ${i + 1}`, key: entry };
      return {
        label: entry.slice(0, sep).trim() || `key ${i + 1}`,
        key: entry.slice(sep + 1).trim(),
      };
    })
    .filter((k) => k.key.length > 0);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface GranolaParticipant {
  name?: string;
  email?: string;
  is_creator?: boolean;
  company?: string;
}

interface GranolaMeeting {
  id: string;
  title: string;
  created_at: string;
  people?: GranolaParticipant[];
  transcript?: string;
  summary?: string;
  notes?: string;
}

/** Free/personal email domains that don't indicate a company. */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "yahoo.in",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "rediffmail.com",
]);

/**
 * Resolve the prospect's company. Meeting titles usually carry a person's first
 * name ("Linkrunner <> Aditya || Intro call"), not the company, so prefer an
 * explicit participant company, then the prospect's work-email domain, and only
 * fall back to the "<> X ||" title token (which is occasionally a real company).
 */
function extractCompanyName(
  title: string,
  participants: GranolaParticipant[]
): string | null {
  // 1. Explicit company on a non-Linkrunner participant, when Granola provides it.
  const withCompany = participants.find(
    (p) =>
      p.company &&
      p.company.trim() &&
      !p.is_creator &&
      !(p.email ?? "").toLowerCase().endsWith("@linkrunner.io")
  );
  if (withCompany?.company) return withCompany.company.trim();

  // 2. Prospect's work-email domain (skip Linkrunner + free/personal mailboxes).
  const prospect = participants.find((p) => {
    if (!p.email || p.is_creator) return false;
    const domain = p.email.split("@")[1]?.toLowerCase();
    return (
      !!domain &&
      !domain.endsWith("linkrunner.io") &&
      !FREE_EMAIL_DOMAINS.has(domain)
    );
  });
  if (prospect?.email) {
    const label = prospect.email.split("@")[1].toLowerCase().split(".")[0];
    if (label) return label.charAt(0).toUpperCase() + label.slice(1);
  }

  // 3. Fall back to the title token.
  const match = title.match(/<>\s*(.+?)\s*\|\|/);
  if (match) return match[1].trim();

  return null;
}

/**
 * Find the primary prospect contact email (first non-Linkrunner, non-creator participant).
 */
function extractContactEmail(
  participants: GranolaParticipant[]
): string | null {
  const prospect = participants.find(
    (p) =>
      p.email &&
      !p.is_creator &&
      !p.email.endsWith("@linkrunner.io")
  );
  return prospect?.email ?? null;
}

type MeetingClass = "prospect" | "internal_only" | "no_participants";

/**
 * Decide whether a note belongs in the DSR cache.
 *
 * The API key exposes every note its owner records — internal standups and
 * 1:1s included — so only meetings with an external (non-Linkrunner,
 * non-creator) participant are synced. Free-email domains pass: a prospect
 * on gmail is still a prospect, and extractCompanyName handles that case.
 *
 * "no_participants" is called out separately from "internal_only" because
 * the two mean very different things. Granola populates attendees from the
 * calendar event, so a note with no participants at all almost always means
 * the recorder's calendar isn't shared with the account — a setup problem,
 * not an internal meeting. Reporting them together would silently hide it.
 */
function classifyMeeting(participants: GranolaParticipant[]): MeetingClass {
  const withEmail = participants.filter(
    (p): p is GranolaParticipant & { email: string } => Boolean(p.email)
  );
  if (withEmail.length === 0) return "no_participants";

  const hasExternal = withEmail.some(
    (p) => !p.is_creator && !p.email.toLowerCase().endsWith("@linkrunner.io")
  );
  return hasExternal ? "prospect" : "internal_only";
}

/**
 * Fetch the full verbatim transcript for a single meeting from the Granola API.
 * Returns null if the transcript is not available.
 */
async function fetchTranscript(
  meetingId: string,
  apiKey: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${GRANOLA_API}/notes/${meetingId}?include=transcript`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.transcript ?? null;
  } catch {
    return null;
  }
}

/**
 * List all notes created after the given date, following cursor pagination.
 */
async function listNotes(
  sinceIso: string,
  apiKey: string
): Promise<{ meetings: GranolaMeeting[] } | { error: string; status: number }> {
  const meetings: GranolaMeeting[] = [];
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams({
      limit: "50",
      created_after: sinceIso,
    });
    if (cursor) params.set("cursor", cursor);

    let res = await fetch(`${GRANOLA_API}/notes?${params}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    // One retry on rate-limit: unattended cron runs shouldn't fail on a 429.
    if (res.status === 429) {
      await sleep(5000);
      res = await fetch(`${GRANOLA_API}/notes?${params}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
    }

    if (!res.ok) {
      const text = await res.text();
      return { error: `Granola API error: ${res.status} ${text}`, status: 502 };
    }

    const data = await res.json();
    const notes: GranolaMeeting[] = data.notes ?? data.data ?? [];
    meetings.push(...notes);
    cursor = data.next_cursor ?? data.cursor ?? null;
  } while (cursor);

  return { meetings };
}

/**
 * Pull recent meetings across every configured key and upsert them into
 * granola_meeting_cache. Shared by the admin button (POST) and cron (GET).
 *
 * Each key is listed independently so one revoked or unsubscribed key
 * degrades to a warning instead of failing the whole sync.
 */
async function runSync({ dryRun = false }: { dryRun?: boolean } = {}) {
  const keys = loadKeys();

  if (keys.length === 0) {
    return NextResponse.json(
      { error: "GRANOLA_API_KEYS not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch recent meetings from Granola (last 90 days)
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const sinceIso = since.toISOString();

    // Dedupe across keys: two reps in the same call may both see the note.
    // First key to return it also owns fetching its transcript.
    const found = new Map<string, { meeting: GranolaMeeting; apiKey: string }>();
    const keyResults: { label: string; found: number; error?: string }[] = [];

    for (const { label, key } of keys) {
      const listed = await listNotes(sinceIso, key);

      if ("error" in listed) {
        keyResults.push({ label, found: 0, error: listed.error });
        continue;
      }

      for (const meeting of listed.meetings) {
        if (!found.has(meeting.id)) found.set(meeting.id, { meeting, apiKey: key });
      }
      keyResults.push({ label, found: listed.meetings.length });
      await sleep(BATCH_PAUSE_MS);
    }

    // Every key failed — surface it rather than reporting a successful no-op.
    if (keyResults.every((r) => r.error)) {
      return NextResponse.json(
        {
          error: `All ${keys.length} Granola key(s) failed`,
          keys: keyResults,
        },
        { status: 502 }
      );
    }

    // Drop internal notes before anything touches the database.
    const candidates = [...found.values()].map((c) => ({
      ...c,
      klass: classifyMeeting(c.meeting.people ?? []),
    }));
    const prospectMeetings = candidates.filter((c) => c.klass === "prospect");
    const skippedInternal = candidates.filter(
      (c) => c.klass === "internal_only"
    ).length;
    const skippedNoParticipants = candidates.filter(
      (c) => c.klass === "no_participants"
    ).length;
    const skipped = candidates
      .filter((c) => c.klass !== "prospect")
      .map((c) => ({ title: c.meeting.title, reason: c.klass }));

    if (prospectMeetings.length === 0) {
      return NextResponse.json({
        synced: 0,
        message: "No prospect meetings found",
        skipped_internal: skippedInternal,
        skipped_no_participants: skippedNoParticipants,
        skipped,
        keys: keyResults,
      });
    }

    const meetings = prospectMeetings.map((c) => c.meeting);

    // Fetch full transcripts for each meeting (in parallel, batches of 5)
    const transcripts = new Map<string, string>();
    for (let i = 0; i < prospectMeetings.length; i += TRANSCRIPT_BATCH_SIZE) {
      const batch = prospectMeetings.slice(i, i + TRANSCRIPT_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(({ meeting, apiKey }) =>
          meeting.transcript
            ? Promise.resolve(meeting.transcript)
            : fetchTranscript(meeting.id, apiKey)
        )
      );
      results.forEach((result, idx) => {
        if (result.status === "fulfilled" && result.value) {
          transcripts.set(batch[idx].meeting.id, result.value);
        }
      });
      await sleep(BATCH_PAUSE_MS);
    }

    const admin = createAdminClient();

    // Preserve already-curated company names: a re-sync must not overwrite a
    // hand-fixed company_name with the auto-derived one. New rows (or rows with
    // no company yet) fall through to extractCompanyName.
    const { data: existingRows } = await admin
      .from("granola_meeting_cache")
      .select("granola_meeting_id, company_name")
      .in(
        "granola_meeting_id",
        meetings.map((m) => m.id)
      );
    const existingCompany = new Map(
      (existingRows ?? []).map((r) => [r.granola_meeting_id, r.company_name])
    );

    // Transform to our cache format — use transcript as primary content
    const rows = meetings.map((m) => {
      const participants = (m.people ?? []).map((p) => ({
        name: p.name ?? "Unknown",
        email: p.email ?? "",
        company: p.company,
        is_creator: p.is_creator,
      }));

      // Prefer transcript, fall back to summary/notes
      const transcript = transcripts.get(m.id);
      const summary = transcript || m.summary || m.notes || "";

      return {
        granola_meeting_id: m.id,
        title: m.title,
        meeting_date: m.created_at,
        participants,
        summary,
        company_name:
          existingCompany.get(m.id) ??
          extractCompanyName(m.title, participants),
        contact_email: extractContactEmail(participants),
        synced_at: new Date().toISOString(),
      };
    });

    // Dry run: report exactly what would be written, and write nothing. Meeting
    // content is deliberately omitted — titles and derived fields only, enough
    // to sanity-check the internal/external split before the first real sync.
    if (dryRun) {
      return NextResponse.json({
        dry_run: true,
        would_sync: rows.length,
        total_from_granola: candidates.length,
        transcripts_fetched: transcripts.size,
        skipped_internal: skippedInternal,
        skipped_no_participants: skippedNoParticipants,
        skipped,
        keys: keyResults,
        preview: rows.map((r) => ({
          title: r.title,
          meeting_date: r.meeting_date,
          company_name: r.company_name,
          contact_email: r.contact_email,
          participants: r.participants.length,
          has_transcript: transcripts.has(r.granola_meeting_id),
          action: existingCompany.has(r.granola_meeting_id) ? "update" : "insert",
        })),
      });
    }

    const { data: upserted, error: dbError } = await admin
      .from("granola_meeting_cache")
      .upsert(rows, { onConflict: "granola_meeting_id" })
      .select();

    if (dbError) {
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      synced: upserted?.length ?? 0,
      total_from_granola: candidates.length,
      transcripts_fetched: transcripts.size,
      skipped_internal: skippedInternal,
      skipped_no_participants: skippedNoParticipants,
      skipped,
      keys: keyResults,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to sync from Granola",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/granola/sync — manual sync from the admin Granola Meetings panel.
 *
 * `?dryRun=1` reports what would be written without touching the database —
 * worth running once before the first real sync, since a personal API key
 * exposes every note its owner records.
 */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  return runSync({ dryRun });
}

/**
 * GET /api/granola/sync — scheduled sync (Vercel Cron, see vercel.json).
 *
 * Cron requests carry `Authorization: Bearer $CRON_SECRET` instead of the
 * admin session cookie, so this is the one Granola handler not gated by
 * requireAdmin(). It is still fully authenticated — an unset or mismatched
 * CRON_SECRET rejects with 401.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  const provided = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runSync();
}
