/**
 * "Our Customers & References" section — a Flowla-style logo wall.
 *
 * This is global content (the same for every room), so it's rendered from a
 * static list here rather than from per-room DB content. To add a real logo,
 * drop the file in /public/logos and set `src` on its entry below (set `src`
 * to null for an empty placeholder slot).
 */

type CustomerLogo = {
  name: string;
  /** Path under /public, or null to render an empty placeholder slot. */
  src: string | null;
};

const CUSTOMER_LOGOS: CustomerLogo[] = [
  { name: "CARS24", src: "/logos/cars24.png" },
  { name: "FatakPay", src: "/logos/fatakpay.png" },
  { name: "KreditPe", src: "/logos/kreditpe.png" },
  { name: "Cash247", src: "/logos/cash247.png" },
  { name: "Placeholder 1", src: null },
  { name: "Placeholder 2", src: null },
  { name: "Placeholder 3", src: null },
  { name: "Placeholder 4", src: null },
  { name: "Placeholder 5", src: null },
  { name: "Placeholder 6", src: null },
];

export function CustomersReferences() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h2
          className="text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ color: "var(--brand-primary, #4d4bf7)" }}
        >
          Working with leading apps
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
          Trusted by 250+ customers across 3 countries to measure and grow what
          matters.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {CUSTOMER_LOGOS.map((logo) => (
            <LogoTile key={logo.name} logo={logo} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LogoTile({ logo }: { logo: CustomerLogo }) {
  if (!logo.src) {
    return (
      <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/40">
        <span className="text-xs font-medium text-gray-300">Logo</span>
      </div>
    );
  }

  return (
    <div className="flex h-20 items-center justify-center rounded-xl border border-gray-100 bg-white px-4 shadow-sm">
      <img
        src={logo.src}
        alt={logo.name}
        className="max-h-10 max-w-[130px] object-contain"
      />
    </div>
  );
}
