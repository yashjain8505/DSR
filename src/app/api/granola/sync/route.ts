import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Granola API base URL and key.
 * The key is stored in GRANOLA_API_KEY env var.
 */
const GRANOLA_API = "https://api.granola.ai/v1";

interface GranolaParticipant {
  name?: string;
  email?: string;
  is_creator?: boolean;
  company?: string;
}

interface GranolaMeeting {
  id: string;
  title: string;
  start_time: string;
  end_time?: string;
  participants?: GranolaParticipant[];
  summary?: string;
  notes?: string;
}

/**
 * Extract a company name from a meeting title like "Linkrunner <> CompanyName || Intro call"
 * or from non-Linkrunner participant emails.
 */
function extractCompanyName(
  title: string,
  participants: GranolaParticipant[]
): string | null {
  // Try pattern: "Linkrunner <> Person/Company || ..."
  const match = title.match(/<>\s*(.+?)\s*\|\|/);
  if (match) {
    return match[1].trim();
  }

  // Try extracting from non-Linkrunner participant email domain
  const prospect = participants.find(
    (p) =>
      p.email &&
      !p.is_creator &&
      !p.email.endsWith("@linkrunner.io") &&
      !p.email.endsWith("@gmail.com")
  );
  if (prospect?.email) {
    const domain = prospect.email.split("@")[1]?.split(".")[0];
    if (domain) return domain.charAt(0).toUpperCase() + domain.slice(1);
  }

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
 * POST /api/granola/sync
 *
 * Pulls recent meetings from the Granola API and upserts them into
 * our granola_meeting_cache table. Returns the count of synced meetings.
 */
export async function POST() {
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

    const res = await fetch(
      `${GRANOLA_API}/meetings?since=${since.toISOString()}&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Granola API error: ${res.status} ${text}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const meetings: GranolaMeeting[] = data.meetings ?? data ?? [];

    if (!Array.isArray(meetings) || meetings.length === 0) {
      return NextResponse.json({ synced: 0, message: "No meetings found" });
    }

    // Transform to our cache format
    const rows = meetings.map((m) => {
      const participants = (m.participants ?? []).map((p) => ({
        name: p.name ?? "Unknown",
        email: p.email ?? "",
        company: p.company,
        is_creator: p.is_creator,
      }));

      return {
        granola_meeting_id: m.id,
        title: m.title,
        meeting_date: m.start_time,
        participants,
        summary: m.summary || m.notes || "",
        company_name: extractCompanyName(m.title, participants),
        contact_email: extractContactEmail(participants),
        synced_at: new Date().toISOString(),
      };
    });

    const admin = createAdminClient();

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
