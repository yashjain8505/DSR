"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import type { CustomerReference } from "@/lib/types";

export default function CustomerReferencesPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const [refs, setRefs] = useState<CustomerReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New reference form
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CustomerReference | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  async function fetchRefs() {
    try {
      const res = await fetch(`/api/rooms/${roomId}/customer-references`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRefs(data.customer_references);
    } catch {
      setError("Failed to load customer references");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  async function handleAdd() {
    if (!newName.trim() || !newLogoUrl.trim()) {
      setError("Name and logo URL are required");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/customer-references`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          logo_url: newLogoUrl.trim(),
          sort_order: refs.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRefs((prev) => [...prev, data.customer_reference]);
      setNewName("");
      setNewLogoUrl("");
      setShowForm(false);
      setSuccess("Logo added");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleVisibility(ref: CustomerReference) {
    try {
      const res = await fetch(
        `/api/rooms/${roomId}/customer-references/${ref.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_visible: !ref.is_visible }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRefs((prev) =>
        prev.map((r) =>
          r.id === ref.id ? data.customer_reference : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/rooms/${roomId}/customer-references/${deleteTarget.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setRefs((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSuccess("Logo removed");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-48 rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer References
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Add customer logos to show on the &ldquo;Our Customers &amp;
            References&rdquo; tab. Toggle each logo on or off per room.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Add Logo
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

      {/* Add form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Add Customer Logo
          </h3>
          <div className="flex flex-col gap-4">
            <Input
              label="Customer Name"
              placeholder="e.g. CARS24"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              label="Logo URL"
              placeholder="https://... or /logos/filename.png"
              value={newLogoUrl}
              onChange={(e) => setNewLogoUrl(e.target.value)}
            />
            {newLogoUrl && (
              <div className="flex h-16 w-32 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-2">
                <img
                  src={newLogoUrl}
                  alt="Preview"
                  className="max-h-10 max-w-[120px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={handleAdd} loading={saving}>
                Add
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setNewName("");
                  setNewLogoUrl("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Logo list */}
      {refs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-sm text-gray-500">
            No customer logos added yet. Click &ldquo;Add Logo&rdquo; to get
            started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {refs.map((ref) => (
            <div
              key={ref.id}
              className={`flex items-center gap-4 rounded-xl border bg-white p-4 transition-colors ${
                ref.is_visible
                  ? "border-gray-200"
                  : "border-gray-100 opacity-50"
              }`}
            >
              {/* Logo preview */}
              <div className="flex h-12 w-24 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 p-1">
                <img
                  src={ref.logo_url}
                  alt={ref.name}
                  className="max-h-8 max-w-[80px] object-contain"
                />
              </div>

              {/* Name */}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{ref.name}</p>
                <p className="text-xs text-gray-400 truncate max-w-xs">
                  {ref.logo_url}
                </p>
              </div>

              {/* Toggle visibility */}
              <button
                type="button"
                onClick={() => handleToggleVisibility(ref)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  ref.is_visible
                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {ref.is_visible ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Visible
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Hidden
                  </>
                )}
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => setDeleteTarget(ref)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Logo"
        description={`Remove "${deleteTarget?.name}" from this room?`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          This will remove the logo from this room. You can always add it back
          later.
        </p>
      </Dialog>
    </div>
  );
}
