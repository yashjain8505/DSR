"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  className,
}: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-black/50",
        "animate-in fade-in duration-200",
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "dialog-title" : undefined}
      aria-describedby={description ? "dialog-description" : undefined}
    >
      <div
        className={cn(
          "relative w-full max-w-lg rounded-xl bg-white shadow-xl",
          "animate-in zoom-in-95 duration-200",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6">
          <div className="flex-1">
            {title && (
              <h2
                id="dialog-title"
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                id="dialog-description"
                className="mt-1 text-sm text-gray-500"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "-mr-1.5 -mt-1.5 rounded-lg p-1.5 text-gray-400",
              "hover:bg-gray-100 hover:text-gray-600",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d4bf7]",
              "transition-colors duration-150",
            )}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer / Actions */}
        {actions && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
