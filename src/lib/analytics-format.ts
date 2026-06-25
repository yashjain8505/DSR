import { MAIN_TAB_LABELS } from "@/lib/constants";

/**
 * Shared formatting helpers for the admin analytics drilldowns (per-room and
 * global). Keeping them here guarantees both views describe events and time
 * identically.
 */

/** Seconds -> "1h 3m" / "5m 12s" / "42s". */
export function formatDuration(total: number): string {
  const s = Math.max(0, Math.round(total));
  if (s === 0) return "0s";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** Human label for a section key stored on a time_on_tab / tab_click event. */
export function sectionLabel(tab: unknown): string {
  if (typeof tab !== "string" || tab === "page" || tab === "") return "the room";
  return (MAIN_TAB_LABELS as Record<string, string>)[tab] ?? tab;
}

export interface TimedEvent {
  event_type: string;
  event_data: Record<string, unknown> | null;
  room_name?: string;
}

/**
 * Whether a time_on_tab event is from the accurate, idle-excluded, per-section
 * tracker (v >= 2). Legacy events (the old wall-clock tracker) are ignored in
 * every total so existing rooms never show inflated "18h" times.
 */
export function isReliableTimeEvent(
  eventType: string,
  eventData: Record<string, unknown> | null
): boolean {
  if (eventType !== "time_on_tab") return false;
  return Number((eventData as { v?: number } | null)?.v ?? 0) >= 2;
}

/** Total engaged (active) seconds across a list of events (reliable only). */
export function totalActiveSeconds(events: TimedEvent[]): number {
  let total = 0;
  for (const e of events) {
    if (isReliableTimeEvent(e.event_type, e.event_data)) {
      total += Number(
        (e.event_data as { seconds?: number } | null)?.seconds ?? 0
      );
    }
  }
  return total;
}

/**
 * Roll active time up by section (and optionally room), so a drilldown can show
 * exactly where a visitor's minutes went. Sorted by time, descending.
 */
export function aggregateSectionTime(
  events: TimedEvent[],
  includeRoom = false
): { label: string; seconds: number }[] {
  const map = new Map<string, number>();
  for (const e of events) {
    if (!isReliableTimeEvent(e.event_type, e.event_data)) continue;
    const secs = Number(
      (e.event_data as { seconds?: number } | null)?.seconds ?? 0
    );
    if (secs <= 0) continue;
    const section = sectionLabel(
      (e.event_data as { tab?: unknown } | null)?.tab
    );
    const label =
      includeRoom && e.room_name ? `${e.room_name} · ${section}` : section;
    map.set(label, (map.get(label) ?? 0) + secs);
  }
  return Array.from(map.entries())
    .map(([label, seconds]) => ({ label, seconds }))
    .sort((a, b) => b.seconds - a.seconds);
}

/**
 * One-line description for a discrete (non-time) activity event. time_on_tab is
 * excluded here on purpose; it's surfaced via aggregateSectionTime instead so
 * the timeline isn't flooded with per-flush "spent 20s" lines.
 */
export function describeActivityEvent(
  eventType: string,
  eventData: Record<string, unknown> | null
): string {
  const d = (eventData ?? {}) as Record<string, unknown>;
  switch (eventType) {
    case "page_view":
      return "Opened the room";
    case "email_gate_submit":
      return "Signed in through the email gate";
    case "tab_click":
      return `Viewed ${sectionLabel(d.tab)}`;
    case "sub_tab_click":
      return `Viewed ${sectionLabel(d.sub_tab_key ?? d.tab)}`;
    case "video_play":
      return "Played the demo video";
    case "link_click":
      if (typeof d.label === "string") return `Clicked "${d.label}"`;
      if (typeof d.url === "string") return `Clicked link: ${d.url}`;
      return "Clicked a link";
    default:
      return eventType.replace(/_/g, " ");
  }
}
