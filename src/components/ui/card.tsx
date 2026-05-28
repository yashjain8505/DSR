import { cn } from "@/lib/utils";

const variantStyles = {
  default: "border border-gray-200",
  elevated: "shadow-md",
} as const;

type CardVariant = keyof typeof variantStyles;

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

export function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn("border-b border-gray-200 px-6 py-4", className)}
      {...props}
    />
  );
}

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn("px-6 py-4", className)} {...props} />;
}

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn("border-t border-gray-200 px-6 py-4", className)}
      {...props}
    />
  );
}
