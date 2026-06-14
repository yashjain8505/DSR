"use client";

/* ------------------------------------------------------------------ */
/*  Features — what actually sets Linkrunner apart: support and the    */
/*  AI signals. Editorial, no shadows, no em dashes.                   */
/* ------------------------------------------------------------------ */

export function FeaturesBento() {
  const brand = { color: "var(--brand-primary)" };

  return (
    <div className="space-y-12">
      {/* Support */}
      <section>
        <p className="flex items-center gap-2 text-sm font-medium" style={brand}>
          <span
            className="inline-block h-2 w-2"
            style={{ backgroundColor: "var(--brand-primary)" }}
          />
          Support
        </p>
        <h3 className="mt-3.5 max-w-2xl text-2xl font-semibold leading-tight text-gray-900 sm:text-3xl">
          Answers in two hours, not two days
        </h3>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-gray-600">
          Most teams we talk to were stuck with attribution support that took
          two to four days to resolve a single issue. Linkrunner runs on a
          shared WhatsApp group with the people who build the product, so most
          things are sorted within two hours.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-gray-50 p-6">
            <p className="text-sm font-medium text-gray-400">
              Legacy MMP support
            </p>
            <p className="mt-2 text-xl font-semibold text-gray-900">
              2 to 4 days per issue
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Email tickets, with SLAs that depend on your contract size.
            </p>
          </div>
          <div
            className="rounded-2xl border-2 p-6"
            style={{ borderColor: "var(--brand-primary)" }}
          >
            <p className="text-sm font-medium" style={brand}>
              Linkrunner
            </p>
            <p className="mt-2 text-xl font-semibold text-gray-900">
              Under 2 hours, on WhatsApp
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              A shared group with the people who build the product. Quick text,
              quick fix.
            </p>
          </div>
        </div>
      </section>

      {/* AI signals */}
      <section>
        <p className="flex items-center gap-2 text-sm font-medium" style={brand}>
          <span
            className="inline-block h-2 w-2"
            style={{ backgroundColor: "var(--brand-primary)" }}
          />
          AI signals
        </p>
        <h3 className="mt-3.5 max-w-2xl text-2xl font-semibold leading-tight text-gray-900 sm:text-3xl">
          It tells you the moment something breaks
        </h3>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-gray-600">
          Linkrunner watches your campaigns around the clock. If ROAS drops
          because of an outdated SDK or a broken link, the AI signal pings you
          immediately, not at the weekly review. You fix it in hours and lose no
          spend.
        </p>
        <div className="mt-6 max-w-xl rounded-2xl bg-gray-50 p-5">
          <div className="flex items-start gap-3">
            <span
              className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--brand-primary)" }}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                ROAS dropping on Meta
              </p>
              <p className="mt-0.5 text-sm leading-6 text-gray-500">
                Outdated SDK on Android. Flagged 3 minutes ago, before the spend
                added up.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
