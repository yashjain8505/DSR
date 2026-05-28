"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  OVERVIEW_SUB_TAB_LABELS,
  PRODUCT_SUB_TABS,
  WHY_LINKRUNNER_SUB_TABS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OverviewSubTab } from "@/lib/types";

type SubTabDraft = {
  id: string;
  sub_tab_key: string;
  content: string;
  youtube_url: string;
  iframe_url: string;
};

export default function OverviewEditorPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const [subTabs, setSubTabs] = useState<SubTabDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openTab, setOpenTab] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubTabs() {
      try {
        const res = await fetch(`/api/rooms/${roomId}/overview-sub-tabs`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const tabs: OverviewSubTab[] = data.overview_sub_tabs;
        setSubTabs(
          tabs.map((t) => ({
            id: t.id,
            sub_tab_key: t.sub_tab_key,
            content: t.content,
            youtube_url: t.youtube_url ?? "",
            iframe_url: t.iframe_url ?? "",
          }))
        );
        if (tabs.length > 0) setOpenTab(tabs[0].id);
      } catch {
        setError("Failed to load overview sub-tabs");
      } finally {
        setLoading(false);
      }
    }
    fetchSubTabs();
  }, [roomId]);

  function updateTab(id: string, field: keyof SubTabDraft, value: string) {
    setSubTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = subTabs.map((t) => {
        const update: Record<string, unknown> = {
          id: t.id,
          content: t.content,
        };
        if (t.sub_tab_key === "product_demo") {
          update.youtube_url = t.youtube_url || null;
        }
        if (t.sub_tab_key === "security_compliance") {
          update.iframe_url = t.iframe_url || null;
        }
        return update;
      });

      const res = await fetch(`/api/rooms/${roomId}/overview-sub-tabs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Overview sub-tabs saved");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-96 rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Product & Why Linkrunner
        </h1>
        <Button onClick={handleSave} loading={saving}>
          Save All
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

      {/* Product sub-tabs group */}
      <div className="space-y-2">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#4d4bf7]">
          Product Tab
        </h2>
        {subTabs
          .filter((t) =>
            (PRODUCT_SUB_TABS as readonly string[]).includes(t.sub_tab_key)
          )
          .map((tab) => (
            <SubTabAccordionItem
              key={tab.id}
              tab={tab}
              isOpen={openTab === tab.id}
              onToggle={() =>
                setOpenTab(openTab === tab.id ? null : tab.id)
              }
              onUpdate={updateTab}
            />
          ))}
      </div>

      {/* Why Linkrunner sub-tabs group */}
      <div className="mt-8 space-y-2">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#4d4bf7]">
          Why Linkrunner Tab
        </h2>
        {subTabs
          .filter((t) =>
            (WHY_LINKRUNNER_SUB_TABS as readonly string[]).includes(
              t.sub_tab_key
            )
          )
          .map((tab) => (
            <SubTabAccordionItem
              key={tab.id}
              tab={tab}
              isOpen={openTab === tab.id}
              onToggle={() =>
                setOpenTab(openTab === tab.id ? null : tab.id)
              }
              onUpdate={updateTab}
            />
          ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SubTabAccordionItem({
  tab,
  isOpen,
  onToggle,
  onUpdate,
}: {
  tab: SubTabDraft;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (id: string, field: keyof SubTabDraft, value: string) => void;
}) {
  const label =
    OVERVIEW_SUB_TAB_LABELS[
      tab.sub_tab_key as keyof typeof OVERVIEW_SUB_TAB_LABELS
    ] ?? tab.sub_tab_key;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Accordion header */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between px-6 py-4 text-left",
          "hover:bg-gray-50 transition-colors rounded-xl"
        )}
      >
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Accordion body */}
      {isOpen && (
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex flex-col gap-4">
            <Textarea
              label="Content (Markdown)"
              value={tab.content}
              onChange={(e) => onUpdate(tab.id, "content", e.target.value)}
              rows={10}
              placeholder="Write content here..."
            />

            {tab.sub_tab_key === "product_demo" && (
              <Input
                label="YouTube Video URL"
                placeholder="https://www.youtube.com/watch?v=..."
                value={tab.youtube_url}
                onChange={(e) =>
                  onUpdate(tab.id, "youtube_url", e.target.value)
                }
              />
            )}

            {tab.sub_tab_key === "security_compliance" && (
              <Input
                label="Iframe URL"
                placeholder="https://trust.linkrunner.io"
                value={tab.iframe_url}
                onChange={(e) =>
                  onUpdate(tab.id, "iframe_url", e.target.value)
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
