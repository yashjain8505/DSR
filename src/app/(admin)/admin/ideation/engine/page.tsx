"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Check, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Sidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Play } from "@/lib/types";

type ConfigTab = "company_context" | "data_assets" | "knowledge_base";
type Tab = ConfigTab | "plays";

const TABS: { key: Tab; label: string }[] = [
  { key: "company_context", label: "Company Context" },
  { key: "data_assets", label: "Data Assets" },
  { key: "knowledge_base", label: "Knowledge Base" },
  { key: "plays", label: "Plays" },
];

const CONFIG_META: Record<ConfigTab, { hint: string; rows: number }> = {
  company_context: {
    hint: "Who we are, differentiators, case studies, and the rules for what makes a good idea. Markdown.",
    rows: 22,
  },
  data_assets: {
    hint: "Real numbers the engine may cite (pricing, benchmarks, gift tiers). Must be valid JSON.",
    rows: 18,
  },
  knowledge_base: {
    hint: "The sales follow-up playbook. The matcher gets the full text; the creative + critic get the '## Synthesis' tail. Markdown.",
    rows: 26,
  },
};

export default function EngineConfigPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [plays, setPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState<Tab>("company_context");

  async function load() {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch("/api/ideation/config"),
        fetch("/api/ideation/plays"),
      ]);
      const cJson = await cRes.json();
      const pJson = await pRes.json();
      if (!cRes.ok) throw new Error(cJson.error);
      if (!pRes.ok) throw new Error(pJson.error);
      setConfig(cJson.config ?? {});
      setPlays(pJson.plays ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial load — same fetch-on-mount pattern as the other admin pages.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  if (loading) {
    return (
      <>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-8 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-56 rounded bg-gray-200" />
              <div className="h-96 rounded-xl bg-gray-100" />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Engine Base Layer
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              The shared rules + reference the ideation engine uses for every
              company. Edits apply to the next run — no deploy.
            </p>
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

          <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  tab === t.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "plays" ? (
            <PlaysEditor
              plays={plays}
              setPlays={setPlays}
              flash={flash}
              onError={setError}
            />
          ) : (
            <ConfigEditor
              key={tab}
              tab={tab}
              value={config[tab] ?? ""}
              onSaved={(val) => {
                setConfig((prev) => ({ ...prev, [tab]: val }));
                flash("Saved");
              }}
              onError={setError}
            />
          )}
        </div>
      </main>
    </>
  );
}

function ConfigEditor({
  tab,
  value,
  onSaved,
  onError,
}: {
  tab: ConfigTab;
  value: string;
  onSaved: (v: string) => void;
  onError: (m: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const meta = CONFIG_META[tab];

  async function save() {
    onError("");
    if (tab === "data_assets") {
      try {
        JSON.parse(draft);
      } catch {
        onError("Data Assets must be valid JSON");
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/ideation/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [tab]: draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onSaved(draft);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="text-xs text-gray-400">{meta.hint}</p>
        <Button onClick={save} loading={saving}>
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={meta.rows}
      />
    </div>
  );
}

function PlaysEditor({
  plays,
  setPlays,
  flash,
  onError,
}: {
  plays: Play[];
  setPlays: Dispatch<SetStateAction<Play[]>>;
  flash: (m: string) => void;
  onError: (m: string) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function toggleActive(play: Play) {
    onError("");
    try {
      const res = await fetch(`/api/ideation/plays/${play.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !play.active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPlays((prev) => prev.map((p) => (p.id === play.id ? json.play : p)));
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update play");
    }
  }

  async function remove(play: Play) {
    if (!confirm(`Delete play "${play.name}"?`)) return;
    onError("");
    try {
      const res = await fetch(`/api/ideation/plays/${play.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPlays((prev) => prev.filter((p) => p.id !== play.id));
      flash("Play deleted");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete play");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {plays.length} plays — the proven moves the matcher chooses from.
        </p>
        <Button
          onClick={() => {
            setShowNew(true);
            setEditingId(null);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Play
        </Button>
      </div>

      {showNew && (
        <div className="mb-4 rounded-xl border-2 border-[#4d4bf7]/20 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">New Play</h3>
            <button
              onClick={() => setShowNew(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <PlayForm
            onSaved={(play) => {
              setPlays((prev) => [...prev, play]);
              setShowNew(false);
              flash("Play created");
            }}
            onError={onError}
          />
        </div>
      )}

      <div className="space-y-2">
        {plays.map((play) =>
          editingId === play.id ? (
            <div
              key={play.id}
              className="rounded-xl border-2 border-[#4d4bf7]/20 bg-white p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Editing: {play.name}
                </h3>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <PlayForm
                existing={play}
                onSaved={(updated) => {
                  setPlays((prev) =>
                    prev.map((p) => (p.id === updated.id ? updated : p)),
                  );
                  setEditingId(null);
                  flash("Play updated");
                }}
                onError={onError}
              />
            </div>
          ) : (
            <div
              key={play.id}
              className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {play.name}
                  </h3>
                  {!play.active && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      inactive
                    </span>
                  )}
                  {play.origin !== "seed" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      {play.origin}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                  {play.description}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                  Triggers: {play.triggers}
                </p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-1">
                <button
                  onClick={() => toggleActive(play)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
                >
                  {play.active ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => {
                    setEditingId(play.id);
                    setShowNew(false);
                  }}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(play)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function PlayForm({
  existing,
  onSaved,
  onError,
}: {
  existing?: Play;
  onSaved: (p: Play) => void;
  onError: (m: string) => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [triggers, setTriggers] = useState(existing?.triggers ?? "");
  const [costTier, setCostTier] = useState(String(existing?.cost_tier ?? 0));
  const [minDeal, setMinDeal] = useState(String(existing?.min_deal_size ?? 0));
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim() || !description.trim()) {
      onError("Name and description are required");
      return;
    }
    onError("");
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        triggers,
        cost_tier: Number(costTier) || 0,
        min_deal_size: Number(minDeal) || 0,
      };
      const res = await fetch(
        existing ? `/api/ideation/plays/${existing.id}` : "/api/ideation/plays",
        {
          method: existing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onSaved(json.play);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save play");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Cost teardown vs incumbent"
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="What the play is and the asset it produces..."
      />
      <Textarea
        label="Triggers"
        value={triggers}
        onChange={(e) => setTriggers(e.target.value)}
        rows={2}
        placeholder="Plain-language conditions for when this play applies (injected into the matcher)..."
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Cost tier (0–2)"
          type="number"
          value={costTier}
          onChange={(e) => setCostTier(e.target.value)}
        />
        <Input
          label="Min deal size (installs/mo)"
          type="number"
          value={minDeal}
          onChange={(e) => setMinDeal(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>
          <Check className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}
