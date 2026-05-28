import { cn } from "@/lib/utils";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  shape?: "line" | "circle" | "rectangle";
  width?: string | number;
  height?: string | number;
};

export function Skeleton({
  shape = "line",
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  const shapeStyles = {
    line: "h-4 w-full rounded",
    circle: "h-10 w-10 rounded-full",
    rectangle: "h-24 w-full rounded-lg",
  } as const;

  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200",
        shapeStyles[shape],
        className,
      )}
      style={{
        ...(width !== undefined && {
          width: typeof width === "number" ? `${width}px` : width,
        }),
        ...(height !== undefined && {
          height: typeof height === "number" ? `${height}px` : height,
        }),
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}
