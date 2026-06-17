import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Granola public API base URL and key.
 * The key is stored in GRANOLA_API_KEY env var.
 * (api.granola.ai does not exist — only public-api.granola.ai does.)
 */
const GRANOLA_API = "https://public-api.granola.ai/v1";

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

    const res = await fetch(`${GRANOLA_API}/notes?${params}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

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
 * POST /api/granola/sync
 *
 * Pulls recent meetings from the Granola API, fetches full transcripts
 * for each, and upserts them into our granola_meeting_cache table.
 * Returns the count of synced meetings.
 */
export async function POST() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const apiKey = process.env.GRANOLA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GRANOLA_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch recent meetings from Granola (last 90 days)
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const listed = await listNotes(since.toISOString(), apiKey);

    if ("error" in listed) {
      return NextResponse.json(
        { error: listed.error },
        { status: listed.status }
      );
    }

    const meetings = listed.meetings;

    if (meetings.length === 0) {
      return NextResponse.json({ synced: 0, message: "No meetings found" });
    }

    // Fetch full transcripts for each meeting (in parallel, batches of 5)
    const transcripts = new Map<string, string>();
    for (let i = 0; i < meetings.length; i += 5) {
      const batch = meetings.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map((m) =>
          m.transcript
            ? Promise.resolve(m.transcript)
            : fetchTranscript(m.id, apiKey)
        )
      );
      results.forEach((result, idx) => {
        if (result.status === "fulfilled" && result.value) {
          transcripts.set(batch[idx].id, result.value);
        }
      });
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
      total_from_granola: meetings.length,
      transcripts_fetched: transcripts.size,
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
