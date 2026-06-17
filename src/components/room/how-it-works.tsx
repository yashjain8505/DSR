"use client";

import { ExternalLink } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  How it works — five quick steps, a book-a-call box, and a link to  */
/*  the full docs (docs.linkrunner.io can't be iframed: X-Frame DENY). */
/*  No shadows, no em dashes.                                          */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    title: "Drop in the SDK",
    body: "Add three lines of code. Most teams are live in under ten minutes.",
  },
  {
    title: "Add your subdomain",
    body: "Point a branded subdomain at Linkrunner so your links and deep links run on your own domain.",
  },
  {
    title: "Connect your channels",
    body: "Link Meta, Google, TikTok, and the rest. Linkrunner starts attributing installs and events right away.",
  },
  {
    title: "Map your events",
    body: "Tell us which events matter, like sign up, purchase, and add to cart, and we wire them up.",
  },
  {
    title: "Go live and iterate",
    body: "Watch the install path update live, then move budget to what works.",
  },
];

export function HowItWorks() {
  const brand = { color: "var(--brand-primary)" };

  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-medium" style={brand}>
        <span
          className="inline-block h-2 w-2"
          style={{ backgroundColor: "var(--brand-primary)" }}
        />
        How it works
      </p>
      <h2 className="mt-3.5 text-2xl font-semibold leading-tight text-gray-900 sm:text-3xl">
        Five steps to go live
      </h2>

      <ol className="mt-8 space-y-6">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--brand-primary)" }}
            >
              {i + 1}
            </span>
            <div className="pt-0.5">
              <h3 className="text-base font-semibold text-gray-900">
                {s.title}
              </h3>
              <p className="mt-1 max-w-2xl text-[15px] leading-7 text-gray-600">
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {/* Book a call */}
        <div className="rounded-2xl border border-gray-200 p-6">
          <p className="text-base font-semibold text-gray-900">
            Stuck on setup?
          </p>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Book a call with our technical team and we will get you live.
          </p>
          <a
            href="https://meet.darshil.linkrunner.io"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            Book a call
          </a>
        </div>

        {/* Docs */}
        <a
          href="https://docs.linkrunner.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col justify-between rounded-2xl border border-gray-200 p-6 transition-colors hover:bg-gray-50"
        >
          <div>
            <p className="text-base font-semibold text-gray-900">
              Full documentation
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              SDK setup, code samples, and the complete API reference.
            </p>
          </div>
          <span
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium"
            style={brand}
          >
            Open docs
            <ExternalLink className="h-4 w-4" />
          </span>
        </a>
      </div>
    </div>
  );
}
