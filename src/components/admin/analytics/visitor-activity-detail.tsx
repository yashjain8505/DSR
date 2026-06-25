"use client";

import { formatDateTime } from "@/lib/utils";
import {
  formatDuration,
  describeActivityEvent,
  aggregateSectionTime,
  totalActiveSeconds,
} from "@/lib/analytics-format";

export interface DetailEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
  room_name?: string;
}

/**
 * Shared visitor drilldown: total engaged (active) time, a "time by section"
 * breakdown showing exactly where the minutes went, and a clean activity
 * timeline of discrete actions (per-flush time events are rolled into the
 * breakdown instead of flooding the timeline). Used by both the per-room and
 * the global admin analytics views so they look identical.
 */
export function VisitorActivityDetail({
  events,
  includeRoom = false,
}: {
  events: DetailEvent[];
  includeRoom?: boolean;
}) {
  const sections = aggregateSectionTime(events, includeRoom);
  const totalSeconds = totalActiveSeconds(events);
  const maxSecs = sections[0]?.seconds ?? 0;
  const timeline = events.filter((e) => e.event_type !== "time_on_tab");

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      {/* Time by section */}
      <div className="shrink-0 lg:w-72">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Time by section
          </p>
          <span className="text-xs font-semibold text-[#4d4bf7]">
            {formatDuration(totalSeconds)} total
          </span>
        </div>
        {sections.length === 0 ? (
          <p className="py-2 text-xs text-gray-400">
            No engaged time recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {sections.map((s) => (
              <div key={s.label}>
                <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-gray-700">{s.label}</span>
                  <span className="shrink-0 font-medium text-gray-900">
                    {formatDuration(s.seconds)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full bg-[#4d4bf7]"
                    style={{
                      width: `${maxSecs > 0 ? (s.seconds / maxSecs) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity timeline */}
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Activity timeline
        </p>
        {timeline.length === 0 ? (
          <p className="py-2 text-xs text-gray-400">No discrete actions yet.</p>
        ) : (
          <ol className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {timeline.map((event) => (
              <li
                key={event.id}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="flex min-w-0 items-baseline gap-2">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full bg-[#4d4bf7]"
                  />
                  <span className="truncate text-gray-700">
                    {describeActivityEvent(event.event_type, event.event_data)}
                  </span>
                  {includeRoom && event.room_name && (
                    <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                      {event.room_name}
                    </span>
                  )}
                </span>
                <span className="shrink-0 whitespace-nowrap text-xs text-gray-400">
                  {formatDateTime(event.created_at)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
