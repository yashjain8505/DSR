"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Dialog } from "@/components/ui/dialog";
import type { Room, RoomAccessEntry } from "@/lib/types";

/** Every page a room can show, in display order, for the visibility toggles. */
const PAGE_TOGGLES: { key: string; label: string }[] = [
  { key: "recap_discussed", label: "Recap: What we discussed so far" },
  { key: "recap_next_steps", label: "Recap: Next Steps" },
  { key: "what_is_linkrunner", label: "What is Linkrunner" },
  { key: "product_demo", label: "Product Demo" },
  { key: "features", label: "Features" },
  { key: "company_deck", label: "Company Deck" },
  { key: "pricing", label: "Pricing" },
  { key: "customers_references", label: "Our Customers and Case Studies" },
  { key: "comparison", label: "How We Compare" },
  { key: "integrations", label: "Integrations" },
  { key: "security_compliance", label: "Security & Compliance" },
  { key: "how_it_works", label: "How It Works" },
];

export default function RoomSettingsPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form fields
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [tabCustomersReferences, setTabCustomersReferences] = useState(false);
  const [tabCaseStudies, setTabCaseStudies] = useState(false);
  const [tabComparison, setTabComparison] = useState(false);
  const [tabGettingStarted, setTabGettingStarted] = useState(false);
  const [compareAppsflyer, setCompareAppsflyer] = useState(true);
  const [compareAdjust, setCompareAdjust] = useState(true);
  const [compareBranch, setCompareBranch] = useState(true);
  const [brandColor, setBrandColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);

  // Access control
  const [restrictAccess, setRestrictAccess] = useState(false);
  const [accessEntries, setAccessEntries] = useState<RoomAccessEntry[]>([]);
  const [accessUnavailable, setAccessUnavailable] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [newAccessEmail, setNewAccessEmail] = useState("");
  const [accessBusy, setAccessBusy] = useState(false);

  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const r: Room = data.room;
        setRoom(r);
        setCompanyName(r.company_name);
        setSlug(r.slug);
        setContactName(r.contact_name ?? "");
        setContactEmail(r.contact_email ?? "");
        setLogoUrl(r.logo_url ?? "");
        setIsActive(r.is_active);
        setTabCustomersReferences(r.tab_customers_references_visible);
        setTabCaseStudies(r.tab_case_studies_visible);
        setTabComparison(r.tab_comparison_visible);
        setTabGettingStarted(r.tab_getting_started_visible);
        const comps: string[] = r.comparison_competitors ?? ["appsflyer", "adjust", "branch"];
        setCompareAppsflyer(comps.includes("appsflyer"));
        setCompareAdjust(comps.includes("adjust"));
        setCompareBranch(comps.includes("branch"));
        setBrandColor(r.brand_primary_color ?? "");
        setSecondaryColor(r.brand_secondary_color ?? "");
        setRestrictAccess(r.restrict_access ?? false);
        setHiddenSections(r.hidden_sections ?? []);
      } catch {
        setError("Failed to load room");
      } finally {
        setLoading(false);
      }
    }
    async function fetchAccessList() {
      try {
        const res = await fetch(`/api/rooms/${roomId}/access`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAccessEntries(data.entries);
      } catch {
        // room_access table missing until migration 007 is applied
        setAccessUnavailable(true);
      }
    }
    fetchRoom();
    fetchAccessList();
  }, [roomId]);

  async function togglePage(key: string, visible: boolean) {
    const prev = hiddenSections;
    const next = visible
      ? hiddenSections.filter((k) => k !== key)
      : [...new Set([...hiddenSections, key])];
    setHiddenSections(next);
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden_sections: next }),
      });
      if (!res.ok) throw new Error();
      setSuccess("Page visibility updated");
      setTimeout(() => setSuccess(""), 2000);
    } catch {
      setHiddenSections(prev);
      setError(
        "Failed to update page visibility (has migration 011 been applied?)",
      );
    }
  }

  async function handleToggleRestrictAccess(value: boolean) {
    setAccessError("");
    const previous = restrictAccess;
    setRestrictAccess(value);
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restrict_access: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } catch (err) {
      setRestrictAccess(previous);
      setAccessError(
        err instanceof Error && /restrict_access/.test(err.message)
          ? "Access control needs DB migration 007 — run supabase/migrations/007_room_access.sql in the Supabase SQL editor."
          : err instanceof Error
            ? err.message
            : "Failed to update access setting"
      );
    }
  }

  async function handleAddAccessEmail() {
    const email = newAccessEmail.trim().toLowerCase();
    if (!email) return;
    setAccessError("");
    setAccessBusy(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAccessEntries((prev) =>
        prev.some((e) => e.id === data.entry.id) ? prev : [...prev, data.entry]
      );
      setNewAccessEmail("");
    } catch (err) {
      setAccessError(
        err instanceof Error ? err.message : "Failed to add email"
      );
    } finally {
      setAccessBusy(false);
    }
  }

  async function handleRemoveAccessEmail(entry: RoomAccessEntry) {
    setAccessError("");
    try {
      const res = await fetch(
        `/api/rooms/${roomId}/access?id=${encodeURIComponent(entry.id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setAccessEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch (err) {
      setAccessError(
        err instanceof Error ? err.message : "Failed to remove email"
      );
    }
  }

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          slug: slug.trim(),
          contact_name: contactName.trim() || null,
          contact_email: contactEmail.trim() || null,
          logo_url: logoUrl.trim() || null,
          is_active: isActive,
          tab_customers_references_visible: tabCustomersReferences,
          tab_case_studies_visible: tabCaseStudies,
          tab_comparison_visible: tabComparison,
          tab_getting_started_visible: tabGettingStarted,
          comparison_competitors: [
            ...(compareAppsflyer ? ["appsflyer"] : []),
            ...(compareAdjust ? ["adjust"] : []),
            ...(compareBranch ? ["branch"] : []),
          ],
          brand_primary_color: brandColor.trim() || null,
          brand_secondary_color: secondaryColor.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRoom(data.room);
      setSuccess("Settings saved");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setShowDeleteDialog(false);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!room) {
    return <p className="text-sm text-red-600">{error || "Room not found"}</p>;
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Room Settings</h1>

      <div className="space-y-8">
        {/* Basic info */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Basic Information
          </h2>
          <div className="flex flex-col gap-5">
            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Input
              label="Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              helperText={`Room URL: /room/${slug}`}
            />
            <Input
              label="Contact Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <Input
              label="Contact Email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <Input
              label="Logo URL"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Brand Color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#FF5733"
                  helperText="Customer's primary brand color (hex). Auto-extracted from their website when generating from Granola."
                />
              </div>
              {brandColor && (
                <div
                  className="mb-6 h-10 w-10 shrink-0 rounded-lg border border-gray-200"
                  style={{ backgroundColor: brandColor }}
                />
              )}
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Secondary / Accent Color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#00FFC0"
                  helperText="Optional accent shown alongside the primary in the room hero (e.g. Bigul's neon green)."
                />
              </div>
              {secondaryColor && (
                <div
                  className="mb-6 h-10 w-10 shrink-0 rounded-lg border border-gray-200"
                  style={{ backgroundColor: secondaryColor }}
                />
              )}
            </div>
            <Toggle
              checked={isActive}
              onChange={setIsActive}
              label="Room is active"
            />
          </div>
        </section>

        {/* Page visibility */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Page Visibility
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Toggle any page on or off for this room. Changes save immediately.
          </p>
          <div className="flex flex-col gap-3">
            {PAGE_TOGGLES.map((p) => (
              <Toggle
                key={p.key}
                checked={!hiddenSections.includes(p.key)}
                onChange={(v) => togglePage(p.key, v)}
                label={p.label}
              />
            ))}
          </div>
        </section>

        {/* Access control */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Room Access
          </h2>
          {accessUnavailable ? (
            <p className="text-sm text-amber-600">
              Access control needs DB migration 007 — run{" "}
              <code className="rounded bg-amber-50 px-1 py-0.5 text-xs">
                supabase/migrations/007_room_access.sql
              </code>{" "}
              in the Supabase SQL editor, then reload this page.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <Toggle
                checked={restrictAccess}
                onChange={handleToggleRestrictAccess}
                label="Restrict access to invited emails"
              />
              <p className="-mt-2 text-sm text-gray-500">
                {restrictAccess
                  ? "Only the emails below can enter this room. Applies immediately."
                  : "Anyone with the link can enter after the email gate. Turn on to limit access to the emails below."}
              </p>

              {/* Invited emails */}
              <div className="flex flex-wrap gap-2">
                {accessEntries.length === 0 ? (
                  <p className="text-sm italic text-gray-400">
                    No emails invited yet.
                  </p>
                ) : (
                  accessEntries.map((entry) => (
                    <span
                      key={entry.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e6ecff] py-1 pl-3 pr-1.5 text-sm text-[#4d4bf7]"
                    >
                      {entry.email}
                      <button
                        type="button"
                        onClick={() => handleRemoveAccessEmail(entry)}
                        title={`Remove ${entry.email}`}
                        className="rounded-full p-0.5 transition-colors hover:bg-[#c9d4ff]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Invite email"
                    type="email"
                    placeholder="prospect@company.com"
                    value={newAccessEmail}
                    onChange={(e) => setNewAccessEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAccessEmail();
                      }
                    }}
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={handleAddAccessEmail}
                  loading={accessBusy}
                >
                  Add
                </Button>
              </div>
              {accessError && (
                <p className="text-sm text-red-600">{accessError}</p>
              )}
            </div>
          )}
        </section>

        {/* Comparison competitors */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Comparison Table
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Choose which competitors to show in the &ldquo;How We Compare&rdquo;
            tab. Toggle each on or off.
          </p>
          <div className="flex flex-col gap-3">
            <Toggle
              checked={compareAppsflyer}
              onChange={setCompareAppsflyer}
              label="AppsFlyer"
            />
            <Toggle
              checked={compareAdjust}
              onChange={setCompareAdjust}
              label="Adjust"
            />
            <Toggle
              checked={compareBranch}
              onChange={setCompareBranch}
              label="Branch"
            />
          </div>
        </section>

        {/* Actions */}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <div className="flex items-center justify-between">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete Room
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save Settings
          </Button>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Room"
        description={`Are you sure you want to delete "${room.company_name}"? This action cannot be undone.`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          All room content, case studies, comparisons, and analytics data will be
          permanently deleted.
        </p>
      </Dialog>
    </div>
  );
}
