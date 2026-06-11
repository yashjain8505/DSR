"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type IframeEmbedProps = {
  url: string;
  height?: number | string;
  title?: string;
  className?: string;
};

export function IframeEmbed({
  url,
  height = 600,
  title = "Embedded content",
  className,
}: IframeEmbedProps) {
  const [loading, setLoading] = useState(true);

  const heightValue = typeof height === "number" ? `${height}px` : height;

  return (
    <div className={cn("relative w-full", className)}>
      {loading && (
        <div
          className="absolute inset-0"
          style={{ height: heightValue }}
        >
          <Skeleton shape="rectangle" className="h-full w-full" />
        </div>
      )}
      <iframe
        src={url}
        title={title}
        onLoad={() => setLoading(false)}
        className={cn(
          "w-full rounded-lg bg-gray-50",
          loading && "invisible",
        )}
        style={{ height: heightValue, border: 0 }}
      />
    </div>
  );
}
