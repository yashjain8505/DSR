"use client";

import { useState, useRef } from "react";

/**
 * Micro sparkline chart rendered as pure SVG.
 * Supports hover tooltips showing date + value.
 */
interface SparklineProps {
  data: number[];
  dates?: string[]; // YYYY-MM-DD labels for tooltip
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  dates,
  width = 120,
  height = 36,
  color = "#4d4bf7",
  className,
}: SparklineProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length === 0) return null;

  const max = Math.max(...data, 1);
  const padding = 2;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = data.map((val, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padding + chartH - (val / max) * chartH;
    return { x, y, val };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const areaPath = [
    `M ${points[0].x},${height - padding}`,
    ...points.map((p) => `L ${p.x},${p.y}`),
    `L ${points[points.length - 1].x},${height - padding}`,
    "Z",
  ].join(" ");

  const gradientId = `sparkline-grad-${Math.random().toString(36).slice(2, 8)}`;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !dates) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relX = (mouseX / rect.width) * width;

    // Find closest data point
    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i].x - relX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    setHoveredIdx(closest);
  }

  function handleMouseLeave() {
    setHoveredIdx(null);
  }

  const hovered = hoveredIdx !== null ? points[hoveredIdx] : null;
  const hoveredDate =
    hoveredIdx !== null && dates ? dates[hoveredIdx] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        className={className}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Gradient fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover dot */}
        {hovered && (
          <circle
            cx={hovered.x}
            cy={hovered.y}
            r={3}
            fill="white"
            stroke={color}
            strokeWidth={1.5}
          />
        )}
      </svg>

      {/* Tooltip */}
      {hovered && hoveredDate && (
        <div
          className="pointer-events-none absolute -top-9 z-10 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg"
          style={{
            left: `${(hovered.x / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {formatTooltipDate(hoveredDate)} · {hovered.val} view
          {hovered.val !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
