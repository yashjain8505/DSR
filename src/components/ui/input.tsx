"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: "default" | "error";
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, variant, className, id: idProp, ...props },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hasError = variant === "error" || !!error;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "block w-full rounded-lg border px-3 py-2 text-sm text-[#0f172a]",
          "placeholder:text-[#9ca3af]",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
          hasError
            ? "border-red-500 focus:border-red-500 focus:ring-red-200"
            : "border-[#d1d5db] focus:border-[#4d4bf7] focus:ring-[#c9d4ff]",
          className,
        )}
        aria-invalid={hasError || undefined}
        aria-describedby={
          error ? `${id}-error` : helperText ? `${id}-helper` : undefined
        }
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${id}-helper`} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
});
