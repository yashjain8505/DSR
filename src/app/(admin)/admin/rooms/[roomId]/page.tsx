"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Dialog } from "@/components/ui/dialog";
import type { Room } from "@/lib/types";

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
      } catch {
        setError("Failed to load room");
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
  }, [roomId]);

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
            <Toggle
              checked={isActive}
              onChange={setIsActive}
              label="Room is active"
            />
          </div>
        </section>

        {/* Tab visibility */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Tab Visibility
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Meeting Brief, Product, Why Linkrunner, and Pricing are always
            visible. Toggle additional tabs below.
          </p>
          <div className="flex flex-col gap-3">
            <Toggle
              checked={tabCustomersReferences}
              onChange={setTabCustomersReferences}
              label="Our Customers & References"
            />
            <Toggle
              checked={tabCaseStudies}
              onChange={setTabCaseStudies}
              label="Case Studies"
            />
            <Toggle
              checked={tabComparison}
              onChange={setTabComparison}
              label="How We Compare"
            />
            <Toggle
              checked={tabGettingStarted}
              onChange={setTabGettingStarted}
              label="Getting Started"
            />
          </div>
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
