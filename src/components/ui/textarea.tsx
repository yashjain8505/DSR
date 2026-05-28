"use client";

import { forwardRef, useCallback, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
    autoResize?: boolean;
  };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      error,
      autoResize = false,
      className,
      id: idProp,
      onChange,
      ...props
    },
    forwardedRef,
  ) {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    const resize = useCallback(() => {
      const el = internalRef.current;
      if (!el || !autoResize) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, [autoResize]);

    useEffect(() => {
      resize();
    }, [resize, props.value, props.defaultValue]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      resize();
    };

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={setRefs}
          id={id}
          onChange={handleChange}
          className={cn(
            "block w-full rounded-lg border px-3 py-2 text-sm text-[#0f172a]",
            "placeholder:text-[#9ca3af]",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
            autoResize && "resize-none overflow-hidden",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-200"
              : "border-[#d1d5db] focus:border-[#4d4bf7] focus:ring-[#c9d4ff]",
            className,
          )}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);
