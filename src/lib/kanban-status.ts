export type KanbanStage =
  | "paying-customer"
  | "integration-started"
  | "follow-up-2-done"
  | "email-second-sent"
  | "email-first-sent"
  | "demo-scheduled"
  | "demo-no-next"
  | "attention-needed"
  | "snoozed-date"
  | "snoozed-cycle"
  | "no-show"
  | "demo-next";

export interface KanbanEntry {
  stage: KanbanStage;
  lastTouch: string;
  notes: string;
}

const STAGE_LABELS: Record<KanbanStage, string> = {
  "paying-customer": "Paying Customer",
  "integration-started": "Integration Started",
  "follow-up-2-done": "Follow-up 2 Done",
  "email-second-sent": "Email 2 Sent",
  "email-first-sent": "Email 1 Sent",
  "demo-scheduled": "Demo Scheduled",
  "demo-no-next": "Demo — No Next",
  "attention-needed": "Attention Needed",
  "snoozed-date": "Snoozed",
  "snoozed-cycle": "Snoozed",
  "no-show": "No-show",
  "demo-next": "Demo Next",
};

const STAGE_COLORS: Record<KanbanStage, { bg: string; text: string }> = {
  "paying-customer": { bg: "bg-green-100", text: "text-green-700" },
  "integration-started": { bg: "bg-blue-100", text: "text-blue-700" },
  "follow-up-2-done": { bg: "bg-amber-100", text: "text-amber-700" },
  "email-second-sent": { bg: "bg-orange-100", text: "text-orange-700" },
  "email-first-sent": { bg: "bg-yellow-100", text: "text-yellow-700" },
  "demo-scheduled": { bg: "bg-purple-100", text: "text-purple-700" },
  "demo-no-next": { bg: "bg-gray-100", text: "text-gray-600" },
  "attention-needed": { bg: "bg-red-100", text: "text-red-700" },
  "snoozed-date": { bg: "bg-slate-100", text: "text-slate-600" },
  "snoozed-cycle": { bg: "bg-slate-100", text: "text-slate-600" },
  "no-show": { bg: "bg-gray-100", text: "text-gray-500" },
  "demo-next": { bg: "bg-indigo-100", text: "text-indigo-700" },
};

// Aliases for room names that don't match kanban card names directly
const NAME_ALIASES: Record<string, string> = {
  collectedge: "credfix",
  haptik: "haptik (mycallgenie)",
};

interface KanbanCard {
  name: string;
  stage: string;
  touchDate: string;
  notes: string;
}

interface KanbanData {
  cards: Record<string, KanbanCard>;
}

export async function fetchKanbanMap(): Promise<Record<string, KanbanEntry>> {
  try {
    const res = await fetch(
      "https://yashjain8505.github.io/linkrunner-kanban/data.json",
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return {};
    const data: KanbanData = await res.json();

    const lookup: Record<string, KanbanEntry> = {};
    for (const card of Object.values(data.cards)) {
      const key = card.name.toLowerCase().trim();
      if (isValidStage(card.stage)) {
        lookup[key] = {
          stage: card.stage,
          lastTouch: card.touchDate || "",
          notes: card.notes || "",
        };
      }
    }
    return lookup;
  } catch {
    return {};
  }
}

function isValidStage(s: string): s is KanbanStage {
  return [
    "paying-customer",
    "integration-started",
    "follow-up-2-done",
    "email-second-sent",
    "email-first-sent",
    "demo-scheduled",
    "demo-no-next",
    "attention-needed",
    "snoozed-date",
    "snoozed-cycle",
    "no-show",
    "demo-next",
  ].includes(s);
}

export function lookupKanban(
  map: Record<string, KanbanEntry>,
  companyName: string
): KanbanEntry | null {
  const key = companyName.toLowerCase().trim();
  if (map[key]) return map[key];
  const alias = NAME_ALIASES[key];
  if (alias && map[alias]) return map[alias];
  // Partial match: kanban name starts with the room name
  for (const [k, v] of Object.entries(map)) {
    if (k.startsWith(key) || key.startsWith(k)) return v;
  }
  return null;
}

export function getStageLabel(stage: KanbanStage): string {
  return STAGE_LABELS[stage] ?? stage;
}

export function getStageColors(stage: KanbanStage): { bg: string; text: string } {
  return STAGE_COLORS[stage] ?? { bg: "bg-gray-100", text: "text-gray-500" };
}
