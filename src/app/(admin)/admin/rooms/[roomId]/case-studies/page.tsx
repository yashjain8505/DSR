"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import type { CaseStudy } from "@/lib/types";

type CaseStudyDraft = {
  title: string;
  customer_name: string;
  customer_logo_url: string;
  content: string;
  sort_order: number;
};

const emptyDraft: CaseStudyDraft = {
  title: "",
  customer_name: "",
  customer_logo_url: "",
  content: "",
  sort_order: 0,
};

export default function CaseStudiesPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CaseStudyDraft>({ ...emptyDraft });
  const [showForm, setShowForm] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStudies();
  }, [roomId]);

  async function fetchStudies() {
    try {
      const res = await fetch(`/api/rooms/${roomId}/case-studies`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStudies(data.case_studies);
    } catch {
      setError("Failed to load case studies");
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setEditingId(null);
    setDraft({ ...emptyDraft, sort_order: studies.length });
    setShowForm(true);
  }

  function startEdit(study: CaseStudy) {
    setEditingId(study.id);
    setDraft({
      title: study.title,
      customer_name: study.customer_name,
      customer_logo_url: study.customer_logo_url ?? "",
      content: study.content,
      sort_order: study.sort_order,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setDraft({ ...emptyDraft });
  }

  async function handleSave() {
    if (!draft.title.trim() || !draft.customer_name.trim()) {
      setError("Title and customer name are required");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const payload = {
        title: draft.title.trim(),
        customer_name: draft.customer_name.trim(),
        customer_logo_url: draft.customer_logo_url.trim() || undefined,
        content: draft.content,
        sort_order: draft.sort_order,
      };

      let res: Response;
      if (editingId) {
        res = await fetch(
          `/api/rooms/${roomId}/case-studies/${editingId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        res = await fetch(`/api/rooms/${roomId}/case-studies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      closeForm();
      await fetchStudies();
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
        `/api/rooms/${roomId}/case-studies/${deleteId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setDeleteId(null);
      await fetchStudies();
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
        <h1 className="text-2xl font-bold text-gray-900">Case Studies</h1>
        {!showForm && (
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Add Case Study
          </Button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Inline form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-[#c9d4ff] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Case Study" : "New Case Study"}
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
                label="Title"
                value={draft.title}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="3x ROAS improvement"
              />
              <Input
                label="Customer Name"
                value={draft.customer_name}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    customer_name: e.target.value,
                  }))
                }
                placeholder="Acme Corp"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Customer Logo URL"
                value={draft.customer_logo_url}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    customer_logo_url: e.target.value,
                  }))
                }
                placeholder="https://..."
              />
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
            </div>
            <Textarea
              label="Content (Markdown)"
              value={draft.content}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={8}
              placeholder="Write the case study content..."
            />
            <div className="flex justify-end gap-3">
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
      {studies.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">No case studies yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {studies.map((study) => (
            <div
              key={study.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-4"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900">{study.title}</h3>
                <p className="text-sm text-gray-500">{study.customer_name}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(study)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(study.id)}
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
        title="Delete Case Study"
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
          This case study will be permanently removed.
        </p>
      </Dialog>
    </div>
  );
}
