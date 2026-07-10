"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/admin/sidebar";
import { generateSlug } from "@/lib/utils";

/** Strip a website URL down to a bare domain for the access field. */
function bareDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0];
}

/** Personal email providers — never used as a room access domain. */
const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
  "proton.me", "protonmail.com", "live.com", "aol.com", "rediffmail.com",
]);

export default function CreateRoomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [accessDomain, setAccessDomain] = useState("");
  const [domainEdited, setDomainEdited] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  function handleCompanyNameChange(value: string) {
    setCompanyName(value);
    if (!slugEdited) setSlug(generateSlug(value));
  }

  function handleWebsiteChange(value: string) {
    setWebsiteUrl(value);
    // Convenience: keep the access domain in sync with the website until the
    // admin edits the domain field themselves.
    if (!domainEdited) setAccessDomain(bareDomain(value));
  }

  function handleContactEmailChange(value: string) {
    setContactEmail(value);
    // Auto-fill the access domain from the attendee's email, skipping personal
    // providers so we never open the room to an entire public email domain.
    if (!domainEdited) {
      const d = bareDomain(value.split("@")[1] ?? "");
      if (d && !GENERIC_EMAIL_DOMAINS.has(d)) setAccessDomain(d);
    }
  }

  async function uploadLogo(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/assets/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Logo upload failed");
    return data.url as string;
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
      let logoUrl: string | undefined;
      if (logoFile) {
        setStatus("Uploading logo…");
        logoUrl = await uploadLogo(logoFile);
      }

      setStatus(
        transcript.trim()
          ? "Creating room & building the brief from your transcript… (this can take ~15s)"
          : "Creating room…",
      );

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          slug: slug.trim(),
          contact_name: contactName.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          website_url: websiteUrl.trim() || undefined,
          access_domain: accessDomain.trim() || undefined,
          public: isPublic,
          logo_url: logoUrl,
          transcript: transcript.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create room");
        return;
      }

      router.push(`/admin/rooms/${data.room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setStatus("");
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

          <h1 className="mb-1 text-2xl font-bold text-gray-900">
            Create New Room
          </h1>
          <p className="mb-8 text-sm text-gray-500">
            Paste the meeting transcript and we&apos;ll build the structured recap
            automatically. Upload the logo, set the access domain, and you&apos;re
            done.
          </p>

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
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                helperText={`URL path for the room: /${slug || "acme-corp"}`}
                required
              />

              <Input
                label="Attendee Name (from their company)"
                placeholder="Jane Smith"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                helperText="Shown in the room greeting. Do not add anyone from Linkrunner."
              />

              <Input
                label="Attendee Email"
                placeholder="jane@acme.com"
                type="email"
                value={contactEmail}
                onChange={(e) => handleContactEmailChange(e.target.value)}
                helperText="Their email domain decides who can open the room (private by default)."
              />

              <Input
                label="Company Website"
                placeholder="https://acme.com"
                value={websiteUrl}
                onChange={(e) => handleWebsiteChange(e.target.value)}
                helperText="Used to auto-pull the brand color (and the logo, if you don't upload one)."
              />

              <Input
                label="Access Domain"
                placeholder="acme.com"
                value={accessDomain}
                onChange={(e) => {
                  setAccessDomain(e.target.value);
                  setDomainEdited(true);
                }}
                disabled={isPublic}
                helperText="Private by default: only people with an email at this domain can open the room. Auto-filled from the attendee's email/website."
              />

              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#4d4bf7] focus:ring-[#4d4bf7]"
                />
                <span>
                  Make this room public
                  <span className="block text-xs text-gray-500">
                    Anyone with the link can open it. Off by default - rooms are
                    private to the attendee&apos;s domain.
                  </span>
                </span>
              </label>

              {/* Logo image upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Company Logo
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#4d4bf7] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#3d3bd6]"
                />
                <p className="text-xs text-gray-500">
                  {logoFile
                    ? `Selected: ${logoFile.name}`
                    : "PNG, JPG, WebP or SVG. Leave empty to auto-pull the logo from the website."}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Textarea
                  label="Meeting Transcript"
                  placeholder="Paste the full meeting transcript here…"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={10}
                />
                <p className="text-xs text-gray-500">
                  We convert this into the structured recap (Your Situation, Pain
                  Points, What We Showed You, Next Steps). Leave empty to start
                  with a blank brief.
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {loading && status && (
                <p className="text-sm text-gray-500">{status}</p>
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
