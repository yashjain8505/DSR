import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseNextStepsData,
  type NextStep,
  type TeamKey,
} from "@/lib/next-steps";

interface TabNextStepsProps {
  /** Stored next-steps string (versioned JSON, or legacy markdown). */
  nextSteps: string;
  /** Customer logo for the team-tag avatars (falls back to a monogram). */
  customerLogoUrl?: string | null;
  /** Customer name — avatar fallback + alt text. */
  customerName?: string;
}

/** Format an ISO "YYYY-MM-DD" without timezone drift (parse parts locally). */
function formatStepDate(iso: string | null): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Next Steps tab — a shared "Mutual Action Plan".
 * Each step renders on a timeline with a completion node, an optional date, and
 * the logo(s) of the team(s) responsible. Completed steps are struck through.
 * Empty content shows a friendly placeholder.
 */
export function TabNextSteps({
  nextSteps,
  customerLogoUrl,
  customerName,
}: TabNextStepsProps) {
  const data = parseNextStepsData(nextSteps ?? "");
  const steps = data.steps.filter(
    (s) => s.title.trim() || s.description.trim(),
  );
  const showTeamLogos = data.config.showTeamLogos;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header with brand accent bar */}
      <div className="mb-8 flex items-start gap-4">
        <div
          className="mt-1 h-12 w-1.5 shrink-0 rounded-full"
          style={{ background: "var(--brand-primary)" }}
        />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Next Steps
          </h2>
          <p className="mt-2 text-base text-gray-500">
            What&rsquo;s coming up next in our partnership
          </p>
        </div>
      </div>

      {/* Content card */}
      <div
        className="relative overflow-hidden rounded-2xl border bg-white shadow-sm"
        style={{
          borderColor:
            "color-mix(in srgb, var(--brand-primary) 20%, #e5e7eb)",
        }}
      >
        {/* Top brand gradient strip */}
        <div
          className="h-1.5"
          style={{
            background:
              "linear-gradient(90deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 40%, #4d4bf7))",
          }}
        />

        {/* Body */}
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          {steps.length > 0 ? (
            <ol className="relative">
              {steps.map((step, i) => (
                <StepRow
                  key={step.id}
                  step={step}
                  isLast={i === steps.length - 1}
                  showTeamLogos={showTeamLogos}
                  customerLogoUrl={customerLogoUrl}
                  customerName={customerName}
                />
              ))}
            </ol>
          ) : (
            <p className="text-sm italic text-gray-400">
              Next steps will be shared here soon.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StepRow({
  step,
  isLast,
  showTeamLogos,
  customerLogoUrl,
  customerName,
}: {
  step: NextStep;
  isLast: boolean;
  showTeamLogos: boolean;
  customerLogoUrl?: string | null;
  customerName?: string;
}) {
  const { completed, title, description } = step;
  const date = formatStepDate(step.date);

  return (
    <li className="relative flex gap-4 pb-7 last:pb-0">
      {/* Timeline connector (omitted on the last row) */}
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute left-[15px] top-8 bottom-0 w-px"
          style={{
            background: "color-mix(in srgb, var(--brand-primary) 22%, #e5e7eb)",
          }}
        />
      )}

      {/* Status node */}
      {completed ? (
        <span
          className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
          style={{ background: "var(--brand-primary)" }}
        >
          <Check className="h-[18px] w-[18px] text-white" strokeWidth={3} />
        </span>
      ) : (
        <span
          className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-white"
          style={{
            borderColor: "color-mix(in srgb, var(--brand-primary) 45%, #ffffff)",
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: "color-mix(in srgb, var(--brand-primary) 45%, #ffffff)",
            }}
          />
        </span>
      )}

      {/* Body: title/description on the left, date + logos on the right */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p
            className={cn(
              "text-[15px] font-medium leading-6",
              completed ? "text-gray-400 line-through" : "text-gray-900",
            )}
          >
            {title}
          </p>
          {description && (
            <p
              className={cn(
                "mt-0.5 text-sm leading-6",
                completed ? "text-gray-400" : "text-gray-500",
              )}
            >
              {description}
            </p>
          )}
        </div>

        {(date || (showTeamLogos && step.teams.length > 0)) && (
          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
            {date && (
              <span className="whitespace-nowrap text-xs font-medium text-gray-500">
                {date}
              </span>
            )}
            {showTeamLogos && (
              <TeamLogos
                teams={step.teams}
                customerLogoUrl={customerLogoUrl}
                customerName={customerName}
              />
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function TeamLogos({
  teams,
  customerLogoUrl,
  customerName,
}: {
  teams: TeamKey[];
  customerLogoUrl?: string | null;
  customerName?: string;
}) {
  if (teams.length === 0) return null;
  return (
    <div className="flex -space-x-1.5">
      {teams.map((team) =>
        team === "linkrunner" ? (
          <LogoAvatar
            key="linkrunner"
            src="/logos/linkrunner-icon.png"
            alt="Linkrunner"
          />
        ) : (
          <LogoAvatar
            key="customer"
            src={customerLogoUrl ?? null}
            alt={customerName || "Customer"}
            fallbackText={customerName}
          />
        ),
      )}
    </div>
  );
}

function LogoAvatar({
  src,
  alt,
  fallbackText,
}: {
  src: string | null;
  alt: string;
  fallbackText?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        title={alt}
        className="h-7 w-7 rounded-full border-2 border-white bg-white object-contain shadow-sm"
      />
    );
  }
  const letter = (fallbackText ?? "").trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      title={alt}
      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-semibold shadow-sm"
      style={{
        background: "var(--brand-primary-light)",
        color: "var(--brand-primary)",
      }}
    >
      {letter}
    </span>
  );
}
