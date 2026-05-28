"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export type ToggleProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "role"
> & {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
};

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  className,
  id: idProp,
  ...props
}: ToggleProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full",
          "transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d4bf7] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-[#4d4bf7]" : "bg-gray-200",
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm",
            "transform transition-transform duration-200 ease-in-out",
            "translate-y-0.5",
            checked ? "translate-x-5.5" : "translate-x-0.5",
          )}
        />
      </button>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "cursor-pointer text-sm text-gray-700",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}
