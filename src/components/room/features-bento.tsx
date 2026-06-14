"use client";

/* ------------------------------------------------------------------ */
/*  Features — balanced bento.                                          */
/*  Two compact highlight cards (support + AI signals) over one wide    */
/*  capability panel listing the actual product surface.               */
/*  No shadows, no icon squares, no em dashes. Brand via --brand-primary.*/
/* ------------------------------------------------------------------ */

const CAPABILITIES: { title: string; sub: string }[] = [
  { title: "Attribution", sub: "Installs and events, by campaign" },
  { title: "Deep links", sub: "Right screen, every time" },
  { title: "Deferred deep links", sub: "Survive the app store detour" },
  { title: "SKAN for iOS", sub: "iOS postbacks, decoded" },
  { title: "Audiences", sub: "Cohorts built from behaviour" },
  { title: "Postbacks", sub: "Clean events to ad partners" },
  { title: "Webhooks", sub: "Push events anywhere" },
  { title: "Cohorts", sub: "Retention and payback curves" },
  { title: "Remarketing", sub: "Bring users back" },
  { title: "Data export", sub: "Your data, your warehouse" },
  { title: "PII hashing", sub: "Privacy by default" },
  { title: "Fraud protection", sub: "Included at every tier" },
];

export function FeaturesBento() {
  const brand = { color: "var(--brand-primary)" };

  return (
    <div className="space-y-3.5">
      {/* ── Two highlight cards ── */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="rounded-2xl bg-gray-50 p-5">
          <p className="text-xs font-medium" style={brand}>
            Support
          </p>
          <p className="mt-1.5 text-[15px] font-semibold text-gray-900">
            Under 2 hours, on WhatsApp
          </p>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">
            Legacy MMPs answer in 2 to 4 days. We sit in a shared group with
            your team, answered by the people building the product.
          </p>
        </div>
        <div className="rounded-2xl bg-gray-50 p-5">
          <p className="text-xs font-medium" style={brand}>
            AI signals
          </p>
          <p className="mt-1.5 text-[15px] font-semibold text-gray-900">
            Caught before the weekly review
          </p>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">
            A stale SDK or broken link drops ROAS. The signal pings you in
            minutes, so you fix it the same day.
          </p>
        </div>
      </div>

      {/* ── Capability panel ── */}
      <div className="rounded-2xl bg-gray-50 p-6">
        <p className="flex items-center gap-2 text-sm font-medium" style={brand}>
          <span
            className="inline-block h-2 w-2"
            style={{ backgroundColor: "var(--brand-primary)" }}
          />
          Everything in the platform
        </p>
        <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          {CAPABILITIES.map((cap) => (
            <div key={cap.title}>
              <p className="text-sm font-medium text-gray-900">{cap.title}</p>
              <p className="mt-0.5 text-[13px] leading-5 text-gray-500">
                {cap.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
