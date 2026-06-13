"use client";

import { Fragment, useEffect, useState } from "react";
import {
  ChevronDown,
  Play,
  Plus,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Sidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Prospect {
  id: number;
  company: string;
  contact_name: string | null;
  persona: string | null;
  stage: string;
  deal_size: number | null;
  current_vendor: string | null;
  contract_end_date: string | null;
  notes: string | null;
  context: string | null;
  created_at: string;
}

interface Touch {
  id: number;
  prospect_id: number;
  due_date: string;
  touch_type: string;
  title: string;
  why: string | null;
  draft: string | null;
  is_wild_card: boolean;
  status: string;
  outcome: string | null;
  prospects?: { company: string };
}

const emptyForm = {
  company: "",
  contact_name: "",
  persona: "",
  stage: "demo_done",
  deal_size: "",
  current_vendor: "",
  contract_end_date: "",
  notes: "",
  transcript: "",
};

export default function IdeationPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [touches, setTouches] = useState<Touch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const [runningId, setRunningId] = useState<number | null>(null);
  const [expandedTouch, setExpandedTouch] = useState<number | null>(null);
  const [expandedProspectId, setExpandedProspectId] = useState<number | null>(
    null,
  );
  const [sendingDigest, setSendingDigest] = useState(false);

  async function fetchAll() {
    try {
      const [pRes, tRes] = await Promise.all([
        fetch("/api/ideation/prospects"),
        fetch("/api/ideation/due?days=365"),
      ]);
      const pJson = await pRes.json();
      const tJson = await tRes.json();
      if (!pRes.ok) throw new Error(pJson.error);
      if (!tRes.ok) throw new Error(tJson.error);
      setProspects(pJson.prospects ?? []);
      setTouches(tJson.touches ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial data load — same fetch-on-mount pattern as the other admin pages.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, []);

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  }

  async function handleCreate() {
    if (!form.company.trim()) {
      setError("Company is required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/ideation/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: form.company.trim(),
          contact_name: form.contact_name.trim() || null,
          persona: form.persona.trim() || null,
          stage: form.stage,
          deal_size: form.deal_size ? parseInt(form.deal_size) : null,
          current_vendor: form.current_vendor.trim() || null,
          contract_end_date: form.contract_end_date || null,
          notes: form.notes.trim() || null,
          transcript: form.transcript.trim()
            ? { content: form.transcript.trim(), source: "manual" }
            : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setForm({ ...emptyForm });
      setShowForm(false);
      flash(`Prospect "${json.prospect.company}" created`);
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  async function handleRun(prospect: Prospect) {
    setError("");
    setRunningId(prospect.id);
    try {
      const res = await fetch("/api/ideation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_id: prospect.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const playCount = json.matched?.plays?.length ?? json.matched?.timeline?.length ?? 0;
      const wildCount = json.wild_cards?.length ?? 0;
      flash(
        `Run complete for ${prospect.company}: ${playCount} ${json.signals?.mode === "nurture" ? "timeline touches" : "plays"} + ${wildCount} wild cards`,
      );
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunningId(null);
    }
  }

  async function handleOutcome(
    touch: Touch,
    status: "sent" | "skipped",
    outcome?: "reply" | "no_reply" | "meeting_booked",
  ) {
    setError("");
    try {
      const res = await fetch(`/api/ideation/touches/${touch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, outcome }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (touch.is_wild_card && (outcome === "reply" || outcome === "meeting_booked")) {
        flash("Recorded. Wild card promoted into the play library.");
      } else {
        flash("Recorded.");
      }
      setTouches((prev) => prev.filter((t) => t.id !== touch.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleDigest() {
    setSendingDigest(true);
    setError("");
    try {
      const res = await fetch("/api/ideation/due", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      flash(`Digest sent (${json.sent ?? 0} touches).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send digest");
    } finally {
      setSendingDigest(false);
    }
  }

  if (loading) {
    return (
      <>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-8 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 rounded bg-gray-200" />
              <div className="h-48 rounded-xl bg-gray-100" />
            </div>
          </div>
        </main>
      </>
    );
  }

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ideation Engine</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ideas per prospect — what to do and why, not the written message.
            Granola meetings are matched by company name automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleDigest} loading={sendingDigest}>
            <Send className="h-4 w-4" />
            Slack digest
          </Button>
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            New Prospect
          </Button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

      {/* New prospect form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">New Prospect</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Input
              label="Company *"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="GoDigit (must match Granola name)"
            />
            <Input
              label="Contact Name"
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              placeholder="Chetan Verma"
            />
            <Input
              label="Persona"
              value={form.persona}
              onChange={(e) => setForm({ ...form, persona: e.target.value })}
              placeholder="growth | founder | cto"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Stage
              </label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#4d4bf7] focus:outline-none"
              >
                {["new", "demo_done", "evaluating", "nurture", "negotiating"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>
            </div>
            <Input
              label="Deal Size (installs/mo)"
              type="number"
              value={form.deal_size}
              onChange={(e) => setForm({ ...form, deal_size: e.target.value })}
              placeholder="230000"
            />
            <Input
              label="Current Vendor"
              value={form.current_vendor}
              onChange={(e) => setForm({ ...form, current_vendor: e.target.value })}
              placeholder="AppsFlyer"
            />
            <Input
              label="Contract End (flips nurture mode)"
              type="date"
              value={form.contract_end_date}
              onChange={(e) =>
                setForm({ ...form, contract_end_date: e.target.value })
              }
            />
          </div>
          <div className="mt-4 space-y-4">
            <Textarea
              label="Rep Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Anything not in the transcripts: discount room, internal politics, compelling events..."
            />
            <Textarea
              label="Manual Transcript Dump (optional — Granola meetings load automatically)"
              value={form.transcript}
              onChange={(e) => setForm({ ...form, transcript: e.target.value })}
              rows={4}
              placeholder="Paste emails / call notes here if they're not in Granola..."
            />
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={handleCreate} loading={saving}>
              Create
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setForm({ ...emptyForm });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Prospects */}
      <h2 className="mb-3 text-base font-semibold text-gray-900">Prospects</h2>
      {prospects.length === 0 ? (
        <div className="mb-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
          No prospects yet.
        </div>
      ) : (
        <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Stage</th>
                <th className="px-4 py-2.5">Vendor</th>
                <th className="px-4 py-2.5">Installs/mo</th>
                <th className="px-4 py-2.5">Contract End</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => {
                const open = expandedProspectId === p.id;
                return (
                  <Fragment key={p.id}>
                    <tr className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {p.company}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.contact_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.stage}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.current_vendor ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.deal_size?.toLocaleString("en-IN") ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {fmtDate(p.contract_end_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setExpandedProspectId(open ? null : p.id)
                            }
                          >
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 transition-transform",
                                open && "rotate-180",
                              )}
                            />
                            Context
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRun(p)}
                            loading={runningId === p.id}
                            disabled={runningId !== null}
                          >
                            <Play className="h-3.5 w-3.5" />
                            Run
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <td colSpan={7} className="px-4 py-4">
                          <ProspectContext
                            prospect={p}
                            onSaved={(updated) => {
                              setProspects((prev) =>
                                prev.map((x) =>
                                  x.id === updated.id ? updated : x,
                                ),
                              );
                              flash("Context saved");
                            }}
                            onError={setError}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Touch queue */}
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-base font-semibold text-gray-900">
          Pending Touches
        </h2>
        <span className="text-sm text-gray-400">({touches.length})</span>
      </div>
      {touches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
          Nothing pending. Run the engine on a prospect to generate touches.
        </div>
      ) : (
        <div className="space-y-2">
          {touches.map((t) => {
            const open = expandedTouch === t.id;
            return (
              <div
                key={t.id}
                className="rounded-xl border border-gray-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setExpandedTouch(open ? null : t.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="w-16 shrink-0 text-xs font-semibold text-gray-500">
                    {fmtDate(t.due_date)}
                  </span>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {t.touch_type}
                  </span>
                  {t.is_wild_card && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <Sparkles className="h-3 w-3" />
                      wild card
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                    {t.prospects?.company ? `${t.prospects.company}: ` : ""}
                    {t.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-gray-400 transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>
                {open && (
                  <div className="border-t border-gray-100 px-4 py-4">
                    <p className="mb-3 text-sm text-gray-800">
                      <span className="font-medium text-gray-700">Idea:</span>{" "}
                      {t.title}
                    </p>
                    {t.why && (
                      <p className="mb-4 text-sm text-gray-500">
                        <span className="font-medium text-gray-700">Why:</span>{" "}
                        {t.why}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleOutcome(t, "sent")}>
                        Mark sent
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOutcome(t, "sent", "reply")}
                      >
                        Sent + got reply
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOutcome(t, "sent", "meeting_booked")}
                      >
                        Sent + meeting booked
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOutcome(t, "skipped")}
                      >
                        <X className="h-3.5 w-3.5" />
                        Skip
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </div>
      </main>
    </>
  );
}

function ProspectContext({
  prospect,
  onSaved,
  onError,
}: {
  prospect: Prospect;
  onSaved: (p: Prospect) => void;
  onError: (m: string) => void;
}) {
  const [draft, setDraft] = useState(prospect.context ?? "");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function save() {
    onError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/ideation/prospects/${prospect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onSaved(json.prospect);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save context");
    } finally {
      setSaving(false);
    }
  }

  async function regenerate() {
    onError("");
    setRegenerating(true);
    try {
      const res = await fetch(`/api/ideation/prospects/${prospect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate_context" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDraft(json.prospect.context ?? "");
      onSaved(json.prospect);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-500">
        Company context — what the engine knows about {prospect.company}.
        Auto-drafted from meetings on the first run; edit freely and it&apos;s
        used on the next run.
      </p>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={10}
        placeholder="Run the engine once to auto-draft this from the company's meetings, then curate it here."
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} loading={saving}>
          Save context
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={regenerate}
          loading={regenerating}
        >
          Regenerate from meetings
        </Button>
      </div>
    </div>
  );
}
