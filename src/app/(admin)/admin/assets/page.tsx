"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, Check, Save, Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/admin/sidebar";
import {
  ASSET_CATEGORIES,
  ASSET_CATEGORY_LABELS,
  type AssetCategory,
} from "@/lib/constants";
import type { Asset } from "@/lib/types";

const SINGLE_CONTENT_CATEGORIES: AssetCategory[] = [
  "what_is_linkrunner",
  "product_demo",
  "features",
  "how_it_works",
  "company_deck",
  "differentiators",
  "integrations",
  "security_compliance",
];

const MULTI_ITEM_CATEGORIES: AssetCategory[] = [
  "case_studies",
  "comparisons",
];

function isSingleContent(cat: AssetCategory) {
  return SINGLE_CONTENT_CATEGORIES.includes(cat);
}

const CATEGORY_HINTS: Partial<Record<AssetCategory, { type: string; placeholder: string; urlLabel?: string; urlPlaceholder?: string }>> = {
  what_is_linkrunner: { type: "markdown", placeholder: "Describe what Linkrunner is, the problem it solves, and value proposition..." },
  product_demo: { type: "youtube_url", placeholder: "Optional notes about the demo...", urlLabel: "YouTube URL", urlPlaceholder: "https://youtube.com/watch?v=..." },
  features: { type: "markdown", placeholder: "List key features, capabilities, and what the product does..." },
  how_it_works: { type: "markdown", placeholder: "Explain the technical flow — SDK integration, attribution, analytics pipeline..." },
  company_deck: { type: "file_url", placeholder: "Optional notes about the deck...", urlLabel: "PDF URL", urlPlaceholder: "https://drive.google.com/... or any public PDF link" },
  differentiators: { type: "markdown", placeholder: "What makes Linkrunner different from competitors..." },
  integrations: { type: "markdown", placeholder: "Supported integrations — MMPs, ad networks, analytics platforms..." },
  security_compliance: { type: "iframe_url", placeholder: "Optional notes about security certifications...", urlLabel: "Trust Page URL", urlPlaceholder: "https://trust.linkrunner.io" },
  case_studies: { type: "markdown", placeholder: "Describe the customer's challenge, solution, and results..." },
  comparisons: { type: "markdown", placeholder: "How Linkrunner compares to this competitor..." },
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeCategory, setActiveCategory] = useState<AssetCategory>("what_is_linkrunner");

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    try {
      const res = await fetch("/api/assets");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAssets(data.assets);
    } catch {
      setError("Failed to load assets");
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  const filtered = assets.filter((a) => a.category === activeCategory);

  if (loading) {
    return (
      <>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-8 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-48 rounded bg-gray-200" />
              <div className="h-64 rounded-xl bg-gray-100" />
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
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
            <p className="mt-1 text-sm text-gray-500">
              Single source of truth — template content shared across all customer rooms
            </p>
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

          {/* Category tabs */}
          <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            {ASSET_CATEGORIES.map((cat) => {
              const count = assets.filter((a) => a.category === cat).length;
              const hasContent = count > 0;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {ASSET_CATEGORY_LABELS[cat]}
                  {hasContent && (
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      activeCategory === cat ? "bg-[#4d4bf7]" : "bg-green-400"
                    }`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Content area */}
          {isSingleContent(activeCategory) ? (
            <SingleContentEditor
              category={activeCategory}
              asset={filtered[0] ?? null}
              onSaved={(asset) => {
                setAssets((prev) => {
                  const idx = prev.findIndex((a) => a.id === asset.id);
                  if (idx >= 0) return prev.map((a) => (a.id === asset.id ? asset : a));
                  return [...prev, asset];
                });
                showSuccess("Saved");
              }}
              onError={setError}
            />
          ) : (
            <MultiItemEditor
              category={activeCategory}
              items={filtered}
              onRefresh={fetchAssets}
              onSuccess={showSuccess}
              onError={setError}
            />
          )}
        </div>
      </main>
    </>
  );
}

function SingleContentEditor({
  category,
  asset,
  onSaved,
  onError,
}: {
  category: AssetCategory;
  asset: Asset | null;
  onSaved: (a: Asset) => void;
  onError: (msg: string) => void;
}) {
  const hints = CATEGORY_HINTS[category];
  const isUrlType = hints?.type === "youtube_url" || hints?.type === "iframe_url";
  const isFileType = hints?.type === "file_url";

  const [content, setContent] = useState(asset?.content ?? "");
  const [url, setUrl] = useState(asset?.url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setContent(asset?.content ?? "");
    setUrl(asset?.url ?? "");
  }, [asset?.id, category]);

  async function handleSave() {
    onError("");
    setSaving(true);
    try {
      const payload = {
        ...(asset ? { id: asset.id } : {}),
        category,
        title: ASSET_CATEGORY_LABELS[category],
        asset_type: hints?.type ?? "markdown",
        content,
        url: url || null,
      };

      const res = await fetch("/api/assets", {
        method: asset ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved(data.asset);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(file: File) {
    onError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUrl(data.url);

      // Auto-save with the new URL
      const payload = {
        ...(asset ? { id: asset.id } : {}),
        category,
        title: ASSET_CATEGORY_LABELS[category],
        asset_type: hints?.type ?? "file_url",
        content,
        url: data.url,
      };
      const saveRes = await fetch("/api/assets", {
        method: asset ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error);
      onSaved(saveData.asset);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {ASSET_CATEGORY_LABELS[category]}
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            This content is shared across every customer room
          </p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {/* File upload zone for file_url types (e.g. Company Deck) */}
        {isFileType && (
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700">
              {hints?.urlLabel ?? "PDF File"}
            </label>

            {url ? (
              /* Currently uploaded file */
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <FileText className="h-8 w-8 shrink-0 text-red-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {decodeURIComponent(url.split("/").pop() ?? "document.pdf")}
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#4d4bf7] hover:underline"
                  >
                    Open file
                  </a>
                </div>
                <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
                  Replace
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
              </div>
            ) : (
              /* Upload dropzone */
              <label
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
                  uploading
                    ? "border-[#4d4bf7]/30 bg-[#4d4bf7]/5"
                    : "border-gray-300 bg-gray-50 hover:border-[#4d4bf7]/50 hover:bg-[#4d4bf7]/5"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mb-2 h-8 w-8 animate-spin text-[#4d4bf7]" />
                    <p className="text-sm font-medium text-gray-700">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload PDF
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      PDF up to 10 MB
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </label>
            )}

            {/* Also allow pasting a URL manually */}
            <details className="group">
              <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                Or paste a link instead
              </summary>
              <div className="mt-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={hints?.urlPlaceholder ?? "https://drive.google.com/..."}
                />
              </div>
            </details>
          </div>
        )}

        {/* URL input for youtube/iframe types */}
        {isUrlType && (
          <Input
            label={hints?.urlLabel ?? "URL"}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={hints?.urlPlaceholder ?? "https://..."}
          />
        )}

        <Textarea
          label={isUrlType || isFileType ? "Notes (optional)" : "Content (Markdown)"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={isUrlType || isFileType ? 4 : 14}
          placeholder={hints?.placeholder ?? "Write content..."}
        />
      </div>
    </div>
  );
}

function MultiItemEditor({
  category,
  items,
  onRefresh,
  onSuccess,
  onError,
}: {
  category: AssetCategory;
  items: Asset[];
  onRefresh: () => Promise<void>;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const isCaseStudy = category === "case_studies";
  const label = isCaseStudy ? "Case Study" : "Comparison";

  async function handleDelete(id: string) {
    if (!confirm(`Delete this ${label.toLowerCase()}?`)) return;
    try {
      const res = await fetch("/api/assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await onRefresh();
      if (editingId === id) setEditingId(null);
      onSuccess(`${label} deleted`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {items.length} {label.toLowerCase()}{items.length !== 1 ? (isCaseStudy ? "ies" : "s") : ""} — shared across all rooms
        </p>
        <Button
          onClick={() => {
            setShowNew(true);
            setEditingId(null);
          }}
        >
          <Plus className="h-4 w-4" />
          Add {label}
        </Button>
      </div>

      {showNew && (
        <div className="mb-4 rounded-xl border-2 border-[#4d4bf7]/20 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">New {label}</h3>
            <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <MultiItemForm
            category={category}
            onSaved={async () => {
              await onRefresh();
              setShowNew(false);
              onSuccess(`${label} created`);
            }}
            onError={onError}
          />
        </div>
      )}

      {items.length === 0 && !showNew ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">
            No {label.toLowerCase()}{isCaseStudy ? "ies" : "s"} yet
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => setShowNew(true)}
          >
            <Plus className="h-4 w-4" />
            Add one
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) =>
            editingId === item.id ? (
              <div key={item.id} className="rounded-xl border-2 border-[#4d4bf7]/20 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Editing: {item.title}</h3>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <MultiItemForm
                  category={category}
                  existing={item}
                  onSaved={async () => {
                    await onRefresh();
                    setEditingId(null);
                    onSuccess(`${label} updated`);
                  }}
                  onError={onError}
                />
              </div>
            ) : (
              <div key={item.id} className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                  {item.url && (
                    <p className="mt-1 truncate text-xs text-gray-400">{item.url}</p>
                  )}
                  {item.content && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.content}</p>
                  )}
                </div>
                <div className="ml-4 flex shrink-0 gap-1">
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setShowNew(false);
                    }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function MultiItemForm({
  category,
  existing,
  onSaved,
  onError,
}: {
  category: AssetCategory;
  existing?: Asset;
  onSaved: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const hints = CATEGORY_HINTS[category];
  const isCaseStudy = category === "case_studies";

  const [title, setTitle] = useState(existing?.title ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [url, setUrl] = useState(existing?.url ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      onError(`${isCaseStudy ? "Customer name" : "Competitor name"} is required`);
      return;
    }

    onError("");
    setSaving(true);
    try {
      const payload = {
        ...(existing ? { id: existing.id } : {}),
        category,
        title,
        asset_type: "markdown",
        content,
        url: url || null,
      };

      const res = await fetch("/api/assets", {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={isCaseStudy ? "Customer Name" : "Competitor Name"}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={isCaseStudy ? "e.g. Swiggy" : "e.g. AppsFlyer"}
      />
      <Input
        label={isCaseStudy ? "Customer Logo URL" : "Competitor Logo URL"}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/logo.png"
      />
      <Textarea
        label="Content (Markdown)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        placeholder={hints?.placeholder ?? "Write content..."}
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          <Check className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}
