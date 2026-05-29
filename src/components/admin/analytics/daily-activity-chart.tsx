import type { DailyActivity } from "@/lib/types";

interface DailyActivityChartProps {
  data: DailyActivity[];
  height?: number;
}

const LAYERS = [
  { key: "page_view" as const, label: "Page Views", color: "#4d4bf7" },
  { key: "tab_click" as const, label: "Tab Clicks", color: "#7c7af9" },
  {
    key: "email_gate_submit" as const,
    label: "Emails",
    color: "#f59e0b",
  },
  { key: "video_play" as const, label: "Video Plays", color: "#10b981" },
  { key: "link_click" as const, label: "Link Clicks", color: "#94a3b8" },
] as const;

type LayerKey = (typeof LAYERS)[number]["key"];

/**
 * Stacked area chart rendered as pure SVG.
 * Each event type is a stacked layer with a distinct color.
 */
export function DailyActivityChart({
  data,
  height = 200,
}: DailyActivityChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-gray-200 bg-white"
        style={{ height }}
      >
        <p className="text-sm text-gray-400">No activity in this period</p>
      </div>
    );
  }

  const width = 600;
  const padX = 40;
  const padTop = 16;
  const padBottom = 32;
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;

  // Compute stacked values
  const stacked = data.map((d) => {
    const vals: Record<LayerKey, number> = {
      page_view: d.page_view,
      tab_click: d.tab_click,
      email_gate_submit: d.email_gate_submit,
      video_play: d.video_play,
      link_click: d.link_click,
    };
    return vals;
  });

  // Compute cumulative stacks
  const stackedCumulative = stacked.map((vals) => {
    const cum: Record<string, number> = {};
    let running = 0;
    // Bottom to top: link_click → video_play → email → tab → page_view
    for (let i = LAYERS.length - 1; i >= 0; i--) {
      running += vals[LAYERS[i].key];
      cum[LAYERS[i].key] = running;
    }
    return cum;
  });

  const maxY = Math.max(
    ...stackedCumulative.map((c) => c[LAYERS[0].key] ?? 0),
    1
  );

  function x(i: number): number {
    return padX + (i / Math.max(data.length - 1, 1)) * chartW;
  }

  function y(val: number): number {
    return padTop + chartH - (val / maxY) * chartH;
  }

  // Build area paths (top layer first)
  function buildAreaPath(layerIdx: number): string {
    const key = LAYERS[layerIdx].key;
    // Previous layer key (the one below in the stack)
    const belowKey =
      layerIdx < LAYERS.length - 1 ? LAYERS[layerIdx + 1].key : null;

    // Top edge: left to right
    const topEdge = stackedCumulative
      .map((c, i) => `${x(i)},${y(c[key] ?? 0)}`)
      .join(" L ");

    // Bottom edge: right to left (previous layer or baseline)
    const bottomEdge = [...stackedCumulative]
      .reverse()
      .map((c, ri) => {
        const val = belowKey ? (c[belowKey] ?? 0) : 0;
        return `${x(stackedCumulative.length - 1 - ri)},${y(val)}`;
      })
      .join(" L ");

    return `M ${topEdge} L ${bottomEdge} Z`;
  }

  // X-axis labels: show ~5 labels evenly
  const labelCount = Math.min(data.length, 5);
  const labelIndices = Array.from({ length: labelCount }, (_, i) =>
    Math.round((i / (labelCount - 1)) * (data.length - 1))
  );

  // Y-axis grid lines
  const yLines = [0.25, 0.5, 0.75, 1].map((frac) =>
    Math.round(maxY * frac)
  );

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis gridlines */}
        {yLines.map((val) => (
          <g key={val}>
            <line
              x1={padX}
              y1={y(val)}
              x2={width - padX}
              y2={y(val)}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
            <text
              x={padX - 6}
              y={y(val) + 3}
              textAnchor="end"
              className="fill-gray-400"
              fontSize={9}
            >
              {val}
            </text>
          </g>
        ))}

        {/* Baseline */}
        <line
          x1={padX}
          y1={padTop + chartH}
          x2={width - padX}
          y2={padTop + chartH}
          stroke="#e2e8f0"
          strokeWidth={1}
        />

        {/* Stacked areas — render bottom to top */}
        {[...LAYERS].reverse().map((layer, ri) => {
          const layerIdx = LAYERS.length - 1 - ri;
          return (
            <path
              key={layer.key}
              d={buildAreaPath(layerIdx)}
              fill={layer.color}
              fillOpacity={0.65}
            />
          );
        })}

        {/* X-axis date labels */}
        {labelIndices.map((idx) => (
          <text
            key={idx}
            x={x(idx)}
            y={height - 8}
            textAnchor="middle"
            className="fill-gray-400"
            fontSize={9}
          >
            {formatShortDate(data[idx].date)}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {LAYERS.map((layer) => (
          <div key={layer.key} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: layer.color, opacity: 0.65 }}
            />
            <span className="text-xs text-gray-500">{layer.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
