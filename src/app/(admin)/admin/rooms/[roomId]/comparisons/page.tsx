"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import type { Comparison, ComparisonFeature } from "@/lib/types";

type ComparisonDraft = {
  competitor_name: string;
  competitor_logo_url: string;
  content: string;
  sort_order: number;
  comparison_data: ComparisonFeature[];
};

const emptyDraft: ComparisonDraft = {
  competitor_name: "",
  competitor_logo_url: "",
  content: "",
  sort_order: 0,
  comparison_data: [],
};

const emptyFeature: ComparisonFeature = {
  feature: "",
  linkrunner: "",
  competitor: "",
};

export default function ComparisonsPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ComparisonDraft>({ ...emptyDraft });
  const [showForm, setShowForm] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchComparisons();
  }, [roomId]);

  async function fetchComparisons() {
    try {
      const res = await fetch(`/api/rooms/${roomId}/comparisons`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComparisons(data.comparisons);
    } catch {
      setError("Failed to load comparisons");
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setEditingId(null);
    setDraft({ ...emptyDraft, sort_order: comparisons.length });
    setShowForm(true);
  }

  function startEdit(comp: Comparison) {
    setEditingId(comp.id);
    setDraft({
      competitor_name: comp.competitor_name,
      competitor_logo_url: comp.competitor_logo_url ?? "",
      content: comp.content,
      sort_order: comp.sort_order,
      comparison_data: comp.comparison_data ?? [],
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setDraft({ ...emptyDraft });
  }

  function addFeatureRow() {
    setDraft((prev) => ({
      ...prev,
      comparison_data: [...prev.comparison_data, { ...emptyFeature }],
    }));
  }

  function removeFeatureRow(index: number) {
    setDraft((prev) => ({
      ...prev,
      comparison_data: prev.comparison_data.filter((_, i) => i !== index),
    }));
  }

  function updateFeatureRow(
    index: number,
    field: keyof ComparisonFeature,
    value: string
  ) {
    setDraft((prev) => ({
      ...prev,
      comparison_data: prev.comparison_data.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      ),
    }));
  }

  async function handleSave() {
    if (!draft.competitor_name.trim()) {
      setError("Competitor name is required");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const payload = {
        competitor_name: draft.competitor_name.trim(),
        competitor_logo_url: draft.competitor_logo_url.trim() || undefined,
        content: draft.content,
        sort_order: draft.sort_order,
        comparison_data:
          draft.comparison_data.length > 0
            ? draft.comparison_data.filter((r) => r.feature.trim())
            : undefined,
      };

      let res: Response;
      if (editingId) {
        res = await fetch(
          `/api/rooms/${roomId}/comparisons/${editingId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        res = await fetch(`/api/rooms/${roomId}/comparisons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      closeForm();
      await fetchComparisons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const res = await fetch(
        `/api/rooms/${roomId}/comparisons/${deleteId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setDeleteId(null);
      await fetchComparisons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-48 rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Comparisons</h1>
        {!showForm && (
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Add Comparison
          </Button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Inline form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-[#c9d4ff] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Comparison" : "New Comparison"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Competitor Name"
                value={draft.competitor_name}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    competitor_name: e.target.value,
                  }))
                }
                placeholder="Adjust"
              />
              <Input
                label="Competitor Logo URL"
                value={draft.competitor_logo_url}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    competitor_logo_url: e.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </div>
            <Input
              label="Sort Order"
              type="number"
              value={draft.sort_order}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  sort_order: parseInt(e.target.value) || 0,
                }))
              }
            />
            <Textarea
              label="Content (Markdown)"
              value={draft.content}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={6}
              placeholder="Write comparison content..."
            />

            {/* Structured comparison data */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Feature Comparison Table (optional)
                </label>
                <Button variant="ghost" size="sm" onClick={addFeatureRow}>
                  <Plus className="h-3 w-3" />
                  Add Row
                </Button>
              </div>

              {draft.comparison_data.length > 0 && (
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 text-xs font-medium text-gray-500">
                    <span>Feature</span>
                    <span>Linkrunner</span>
                    <span>Competitor</span>
                    <span />
                  </div>
                  {draft.comparison_data.map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2"
                    >
                      <Input
                        value={row.feature}
                        onChange={(e) =>
                          updateFeatureRow(i, "feature", e.target.value)
                        }
                        placeholder="Feature name"
                      />
                      <Input
                        value={row.linkrunner}
                        onChange={(e) =>
                          updateFeatureRow(i, "linkrunner", e.target.value)
                        }
                        placeholder="Yes / No / Details"
                      />
                      <Input
                        value={row.competitor}
                        onChange={(e) =>
                          updateFeatureRow(i, "competitor", e.target.value)
                        }
                        placeholder="Yes / No / Details"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeatureRow(i)}
                        className="self-center rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={closeForm}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {comparisons.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">No comparisons yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comparisons.map((comp) => (
            <div
              key={comp.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-4"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900">
                  vs. {comp.competitor_name}
                </h3>
                {comp.comparison_data && comp.comparison_data.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {comp.comparison_data.length} feature
                    {comp.comparison_data.length !== 1 ? "s" : ""} compared
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(comp)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(comp.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete dialog */}
      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Comparison"
        description="Are you sure? This action cannot be undone."
        actions={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          This comparison will be permanently removed.
        </p>
      </Dialog>
    </div>
  );
}
