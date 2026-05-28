"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RoomHeaderProps {
  companyName: string;
  logoUrl: string | null;
  className?: string;
}

/**
 * Header bar for the prospect-facing room.
 * Completely hidden on the hero section.
 * Slides in as a solid bar once the user scrolls past the hero.
 * Shows both logos prominently with 🤝 between names.
 */
export function RoomHeader({
  companyName,
  logoUrl,
  className,
}: RoomHeaderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      // Show header only after scrolling past ~90% of the viewport (hero)
      setVisible(window.scrollY > window.innerHeight * 0.85);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        visible
          ? "translate-y-0 border-b bg-white/95 shadow-sm backdrop-blur-md"
          : "-translate-y-full",
        className
      )}
      style={visible ? { borderColor: "color-mix(in srgb, var(--brand-primary) 25%, #e5e7eb)" } : undefined}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Both logos first, then names with 🤝 */}
        <div className="flex items-center gap-3">
          {/* Logos side by side */}
          <div className="flex items-center gap-2">
            <img
              src="/logos/linkrunner-icon.png"
              alt="Linkrunner logo"
              className="h-10 w-10 rounded-xl object-contain"
            />
            {logoUrl && (
              <img
                src={logoUrl}
                alt={`${companyName} logo`}
                className="h-10 w-10 rounded-xl object-contain"
              />
            )}
          </div>

          {/* Divider */}
          <div className="mx-1 h-6 w-px bg-gray-200" />

          {/* Names with handshake */}
          <span className="text-base font-semibold text-gray-900">
            Linkrunner
          </span>
          <span className="text-lg">🤝</span>
          <span className="text-base font-semibold text-gray-900">
            {companyName}
          </span>
        </div>

        {/* Live Room badge */}
        <div className="hidden items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 sm:flex">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-green-700">Live Room</span>
        </div>
      </div>
    </header>
  );
}
