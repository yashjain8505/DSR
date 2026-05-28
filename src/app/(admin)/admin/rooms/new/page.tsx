"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/admin/sidebar";
import { generateSlug } from "@/lib/utils";

export default function CreateRoomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  function handleCompanyNameChange(value: string) {
    setCompanyName(value);
    if (!slugEdited) {
      setSlug(generateSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugEdited(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!companyName.trim() || !slug.trim()) {
      setError("Company name and slug are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          slug: slug.trim(),
          contact_name: contactName.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          logo_url: logoUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create room");
        return;
      }

      router.push(`/admin/rooms/${data.room.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          <Link
            href="/admin"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to rooms
          </Link>

          <h1 className="mb-8 text-2xl font-bold text-gray-900">
            Create New Room
          </h1>

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-200 bg-white p-6"
          >
            <div className="flex flex-col gap-5">
              <Input
                label="Company Name"
                placeholder="Acme Corp"
                value={companyName}
                onChange={(e) => handleCompanyNameChange(e.target.value)}
                required
              />

              <Input
                label="Slug"
                placeholder="acme-corp"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                helperText="URL path for the room: /acme-corp"
                required
              />

              <Input
                label="Contact Name"
                placeholder="Jane Smith"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />

              <Input
                label="Contact Email"
                placeholder="jane@acme.com"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />

              <Input
                label="Logo URL"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => router.push("/admin")}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Create Room
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
