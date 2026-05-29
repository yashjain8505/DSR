/**
 * Horizontal funnel bar visualization.
 * Each stage shows a label, count, filled bar, and drop-off from the previous stage.
 */

interface FunnelStage {
  label: string;
  count: number;
  color: string;
}

interface FunnelBarProps {
  stages: FunnelStage[];
}

export function FunnelBar({ stages }: FunnelBarProps) {
  const maxCount = stages[0]?.count ?? 0;

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const width =
          maxCount > 0 ? Math.max((stage.count / maxCount) * 100, 2) : 2;
        const prev = i > 0 ? stages[i - 1].count : 0;
        const dropOff =
          i > 0 && prev > 0
            ? Math.round(((prev - stage.count) / prev) * 100)
            : null;

        return (
          <div key={stage.label}>
            <div className="mb-0.5 flex items-center justify-between">
              <span className="text-xs text-gray-500">{stage.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-900">
                  {stage.count}
                </span>
                {dropOff !== null && (
                  <span className="text-[10px] text-gray-400">
                    {dropOff > 0 ? `${dropOff}% drop` : "—"}
                  </span>
                )}
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${width}%`,
                  backgroundColor: stage.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
