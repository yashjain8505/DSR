/**
 * Session reconstruction + summarization for the Slack activity alerts.
 *
 * A "session" is one visitor's burst of activity in one room: consecutive
 * analytics_events with no gap longer than SESSION_GAP_MIN. The cron
 * (/api/cron/sessions) reconstructs sessions from the raw event log and feeds
 * each one here to build the sign-in and summary Slack messages.
 *
 * Server-only: the Groq narrative reads GROQ_API_KEY.
 */
import {
  sectionBreakdown,
  displayActiveTime,
  describeActivityEvent,
  formatDuration,
  type TimedEvent,
} from "./analytics-format";

/** Inactivity gap (minutes) that separates one session from the next. */
export const SESSION_GAP_MIN = 30;

export interface SessionEvent {
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

export interface ReconstructedSession {
  visitorId: string;
  roomId: string;
  sessionKey: string;
  startedAt: string;
  lastEventAt: string;
  events: SessionEvent[];
}

/**
 * Group a flat, unsorted event list into sessions keyed by (visitor, room),
 * splitting a visitor's stream whenever the gap exceeds SESSION_GAP_MIN.
 * Events must all carry a visitor_id and room_id.
 */
export function reconstructSessions(
  events: { visitor_id: string; room_id: string; event_type: string; event_data: Record<string, unknown> | null; created_at: string }[]
): ReconstructedSession[] {
  const gapMs = SESSION_GAP_MIN * 60_000;

  // Bucket by visitor+room, then order each bucket by time.
  const byPair = new Map<string, typeof events>();
  for (const e of events) {
    if (!e.visitor_id || !e.room_id) continue;
    const k = `${e.visitor_id}:${e.room_id}`;
    (byPair.get(k) ?? byPair.set(k, []).get(k)!).push(e);
  }

  const sessions: ReconstructedSession[] = [];
  for (const [, bucket] of byPair) {
    bucket.sort((a, b) => a.created_at.localeCompare(b.created_at));
    let current: SessionEvent[] = [];
    let startedAt = "";
    let prevMs = 0;

    const flush = (visitorId: string, roomId: string) => {
      if (current.length === 0) return;
      const lastEventAt = current[current.length - 1].created_at;
      sessions.push({
        visitorId,
        roomId,
        sessionKey: `${visitorId}:${roomId}:${startedAt}`,
        startedAt,
        lastEventAt,
        events: current,
      });
      current = [];
    };

    for (const e of bucket) {
      const ms = Date.parse(e.created_at);
      if (current.length === 0 || ms - prevMs > gapMs) {
        flush(e.visitor_id, e.room_id);
        startedAt = e.created_at;
      }
      current.push({ event_type: e.event_type, event_data: e.event_data, created_at: e.created_at });
      prevMs = ms;
    }
    flush(bucket[0].visitor_id, bucket[0].room_id);
  }

  return sessions;
}

/**
 * Turn an email into a display name: "vaibhav.tripathi@x.com" -> "Vaibhav
 * Tripathi". Falls back to the raw email for role/system mailboxes or local
 * parts with digits, where a guessed name would look wrong.
 */
export function prettifyNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const ROLE = new Set([
    "info", "sales", "admin", "support", "hello", "contact", "team",
    "marketing", "growth", "hi", "care", "help", "no-reply", "noreply",
  ]);
  if (!local || ROLE.has(local.toLowerCase()) || /\d/.test(local)) return email;

  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0 || parts.some((p) => p.length < 2)) return email;

  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

/** Build the "where they spent time" + "what they did" lines for a session. */
export function buildSummaryLines(events: SessionEvent[]): {
  activeTimeLabel: string;
  sectionLines: string[];
  actionLines: string[];
} {
  const timed: TimedEvent[] = events.map((e) => ({
    event_type: e.event_type,
    event_data: e.event_data,
  }));

  const { seconds, isEstimate } = displayActiveTime(timed);
  const activeTimeLabel =
    seconds > 0
      ? `${formatDuration(seconds)}${isEstimate ? " (est.)" : ""}`
      : "under a minute";

  const sectionLines = sectionBreakdown(timed)
    .slice(0, 5)
    .map((s) => `• ${s.label} — ${formatDuration(s.seconds)}`);

  // Discrete actions in order, deduped, excluding the per-flush time events.
  const seen = new Set<string>();
  const actionLines: string[] = [];
  for (const e of events) {
    if (e.event_type === "time_on_tab") continue;
    const line = describeActivityEvent(e.event_type, e.event_data);
    if (seen.has(line)) continue;
    seen.add(line);
    actionLines.push(`• ${line}`);
  }

  return { activeTimeLabel, sectionLines, actionLines: actionLines.slice(0, 8) };
}

/**
 * A one-line read of intent via Groq. Never throws and never blocks the alert:
 * returns null when GROQ_API_KEY is unset or the call fails, in which case the
 * summary still goes out with just the stats.
 */
export async function generateNarrative(input: {
  companyName: string;
  activeTimeLabel: string;
  sectionLines: string[];
  actionLines: string[];
}): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (input.sectionLines.length === 0 && input.actionLines.length === 0) return null;

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const system =
    "You summarize a sales-prospect's browsing session in one short sentence " +
    "for the sales team. State where their attention went and what it suggests " +
    "about intent. Be concrete and neutral. No greeting, no preamble, one sentence, max 30 words.";
  const user = [
    `Prospect company: ${input.companyName}`,
    `Active time: ${input.activeTimeLabel}`,
    `Time by section:\n${input.sectionLines.join("\n") || "(none)"}`,
    `Actions:\n${input.actionLines.join("\n") || "(none)"}`,
  ].join("\n\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 120,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
