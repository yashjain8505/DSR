"use client";

import { ChevronDown, Mail } from "lucide-react";

interface RoomHeroProps {
  companyName: string;
  logoUrl: string | null;
  contactName: string | null;
  onScrollDown: () => void;
}

/**
 * Full-viewport hero / landing section for the prospect-facing room.
 * Flowla-inspired warm greeting with dual-brand gradient,
 * both logos above the greeting, and a seller info card.
 */
export function RoomHero({
  companyName,
  logoUrl,
  contactName,
  onScrollDown,
}: RoomHeroProps) {
  const greeting = contactName
    ? `Dear ${contactName} & ${companyName} team,`
    : `Dear ${companyName} team,`;

  return (
    <section
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6"
      style={{
        background:
          "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary) 35%, color-mix(in srgb, var(--brand-primary) 50%, #4d4bf7 50%) 65%, #4d4bf7 100%)",
      }}
    >
      {/* Subtle dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Soft radial glow for depth */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 40%, rgba(255,255,255,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Main content: two-column on desktop, stacked on mobile */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        {/* Left column: welcome text */}
        <div className="flex max-w-2xl flex-col gap-5 text-center lg:text-left">
          {/* Both logos with × between them */}
          <div className="flex items-center gap-4 self-center lg:self-start">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg sm:h-20 sm:w-20">
              <img
                src="/logos/linkrunner-icon.png"
                alt="Linkrunner logo"
                className="h-12 w-12 object-contain sm:h-16 sm:w-16"
              />
            </div>
            <span className="text-2xl font-light text-white/70 sm:text-3xl">&times;</span>
            {logoUrl ? (
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg sm:h-20 sm:w-20">
                <img
                  src={logoUrl}
                  alt={`${companyName} logo`}
                  className="h-12 w-12 object-contain sm:h-16 sm:w-16"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm sm:h-20 sm:w-20">
                <span className="text-lg font-bold text-white sm:text-xl">
                  {companyName.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Greeting line */}
          <p className="text-lg font-light italic tracking-wide text-white/80 sm:text-xl">
            {greeting}
          </p>

          {/* Main heading */}
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Welcome to your
            <br />
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Digital Boardroom
            </span>
          </h1>

          {/* Subtext */}
          <p className="max-w-lg text-base leading-relaxed text-white/70 sm:text-lg lg:max-w-xl">
            We&apos;ve created this space to make your evaluation easier
            &mdash; everything we discuss, share, and agree on, kept here
            for your team.
          </p>

          {/* CTA */}
          <div className="mt-2">
            <button
              type="button"
              onClick={onScrollDown}
              className="inline-flex items-center gap-2 rounded-full bg-white/95 px-7 py-3 text-sm font-semibold shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              style={{ color: "var(--brand-primary)" }}
            >
              Explore Your Room
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right column: seller info card */}
        <div className="w-full max-w-xs shrink-0">
          <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-6 shadow-lg backdrop-blur-md">
            {/* Seller avatar placeholder */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
                YJ
              </div>
              <div>
                <p className="text-base font-semibold text-white">
                  Yash Jain
                </p>
                <p className="text-sm text-white/60">GTM</p>
              </div>
            </div>

            {/* Divider */}
            <div className="mb-4 border-t border-white/10" />

            {/* Contact detail */}
            <a
              href="mailto:yash@linkrunner.io"
              className="flex items-center gap-2.5 text-sm text-white/70 transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4 shrink-0" />
              yash@linkrunner.io
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        type="button"
        onClick={onScrollDown}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/50 transition-colors hover:text-white/80 focus-visible:outline-none"
        aria-label="Scroll to content"
      >
        <ChevronDown className="h-8 w-8" />
      </button>
    </section>
  );
}
