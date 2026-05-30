/**
 * Next-steps "Mutual Action Plan" structure layer.
 *
 * Like the meeting-brief module, next steps are stored as a single string in
 * `meeting_briefs.next_steps` — structure lives only in transit. Rich steps are
 * encoded as a versioned JSON object; legacy rooms (plain markdown, one step
 * per line) are upgraded on read into title-only steps so nothing breaks and no
 * DB migration is needed. Serializing collapses empty steps and, when there is
 * nothing meaningful to store, returns "" to stay byte-compatible with old rows.
 */

import { parseNextSteps } from "./meeting-brief";

/** Which team owns a step — drives the logo(s) shown on its right. */
export type TeamKey = "linkrunner" | "customer";

export interface NextStep {
  /** Stable id for React keys + reordering. */
  id: string;
  title: string;
  /** Optional one-line detail beneath the title. "" when absent. */
  description: string;
  completed: boolean;
  /** ISO calendar date "YYYY-MM-DD", or null when unscheduled. */
  date: string | null;
  /** Teams responsible — rendered as logo avatars on the right. */
  teams: TeamKey[];
}

export interface NextStepsConfig {
  /** Per-room master switch for the team-logo column. */
  showTeamLogos: boolean;
}

export interface NextStepsData {
  config: NextStepsConfig;
  steps: NextStep[];
}

const SCHEMA_VERSION = 1;
/** Canonical team order — Linkrunner always before the customer. */
const VALID_TEAMS: TeamKey[] = ["linkrunner", "customer"];

export const DEFAULT_NEXT_STEPS_CONFIG: NextStepsConfig = {
  showTeamLogos: true,
};

/** Generate a stable id (crypto.randomUUID where available, else a fallback). */
export function newStepId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to the non-crypto fallback */
  }
  return `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/** A fresh step. Defaults to both teams so new rows show both logos. */
export function makeStep(partial: Partial<NextStep> = {}): NextStep {
  return {
    id: partial.id ?? newStepId(),
    title: partial.title ?? "",
    description: partial.description ?? "",
    completed: partial.completed ?? false,
    date: sanitizeDate(partial.date ?? null),
    teams: sanitizeTeams(partial.teams ?? ["linkrunner", "customer"]),
  };
}

export function emptyNextStepsData(): NextStepsData {
  return { config: { ...DEFAULT_NEXT_STEPS_CONFIG }, steps: [] };
}

function sanitizeTeams(teams: unknown): TeamKey[] {
  if (!Array.isArray(teams)) return [];
  const seen = new Set<TeamKey>();
  for (const t of teams) {
    if (VALID_TEAMS.includes(t as TeamKey)) seen.add(t as TeamKey);
  }
  // Preserve canonical order regardless of input order.
  return VALID_TEAMS.filter((t) => seen.has(t));
}

function sanitizeDate(date: unknown): string | null {
  if (typeof date !== "string") return null;
  const t = date.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

/** Coerce arbitrary parsed JSON into a valid, fully-populated NextStepsData. */
export function normalizeNextStepsData(raw: unknown): NextStepsData {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const cfgRaw = (obj.config ?? {}) as Record<string, unknown>;
  const config: NextStepsConfig = {
    showTeamLogos:
      typeof cfgRaw.showTeamLogos === "boolean"
        ? cfgRaw.showTeamLogos
        : DEFAULT_NEXT_STEPS_CONFIG.showTeamLogos,
  };
  const stepsRaw = Array.isArray(obj.steps) ? obj.steps : [];
  const steps: NextStep[] = stepsRaw.map((s) => {
    const o = (s ?? {}) as Record<string, unknown>;
    return {
      id: typeof o.id === "string" && o.id ? o.id : newStepId(),
      title: typeof o.title === "string" ? o.title : "",
      description: typeof o.description === "string" ? o.description : "",
      completed: o.completed === true,
      date: sanitizeDate(o.date),
      teams: sanitizeTeams(o.teams),
    };
  });
  return { config, steps };
}

/** Parse the stored next-steps string into structured data. */
export function parseNextStepsData(content: string): NextStepsData {
  const raw = (content ?? "").trim();
  if (!raw) return emptyNextStepsData();

  // Structured form: a versioned JSON object.
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.v === SCHEMA_VERSION &&
        Array.isArray(parsed.steps)
      ) {
        return normalizeNextStepsData(parsed);
      }
    } catch {
      /* not our JSON — fall back to legacy markdown */
    }
  }

  // Legacy form: plain markdown, one step title per line.
  const titles = parseNextSteps(content);
  return {
    config: { ...DEFAULT_NEXT_STEPS_CONFIG },
    steps: titles.map((title) => makeStep({ title })),
  };
}

/** Whether structured data carries any renderable step. */
export function hasSteps(data: NextStepsData): boolean {
  return data.steps.some((s) => s.title.trim() || s.description.trim());
}

/** Serialize structured data back to the stored string. */
export function serializeNextStepsData(data: NextStepsData): string {
  const norm = normalizeNextStepsData(data);
  // Drop fully-empty steps (no title and no description).
  const steps = norm.steps.filter(
    (s) => s.title.trim() || s.description.trim(),
  );
  // Nothing meaningful and config at default → empty string (back-compat).
  if (
    steps.length === 0 &&
    norm.config.showTeamLogos === DEFAULT_NEXT_STEPS_CONFIG.showTeamLogos
  ) {
    return "";
  }
  return JSON.stringify({ v: SCHEMA_VERSION, config: norm.config, steps });
}
