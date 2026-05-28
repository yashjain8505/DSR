"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { GettingStarted } from "@/lib/types";

export default function GettingStartedPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const [integrationTimeline, setIntegrationTimeline] = useState("");
  const [migrationSteps, setMigrationSteps] = useState("");
  const [onboardingPlan, setOnboardingPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/rooms/${roomId}/getting-started`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const gs: GettingStarted = data.getting_started;
        setIntegrationTimeline(gs.integration_timeline);
        setMigrationSteps(gs.migration_steps);
        setOnboardingPlan(gs.onboarding_plan);
      } catch {
        setError("Failed to load getting started content");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [roomId]);

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch(`/api/rooms/${roomId}/getting-started`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integration_timeline: integrationTimeline,
          migration_steps: migrationSteps,
          onboarding_plan: onboardingPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Getting started content saved");
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
        <h1 className="text-2xl font-bold text-gray-900">Getting Started</h1>
        <Button onClick={handleSave} loading={saving}>
          Save
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <Textarea
            label="Integration Timeline (Markdown)"
            value={integrationTimeline}
            onChange={(e) => setIntegrationTimeline(e.target.value)}
            rows={8}
            placeholder="Describe the integration timeline..."
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <Textarea
            label="Migration Steps (Markdown)"
            value={migrationSteps}
            onChange={(e) => setMigrationSteps(e.target.value)}
            rows={8}
            placeholder="Describe the migration steps..."
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <Textarea
            label="Onboarding Plan (Markdown)"
            value={onboardingPlan}
            onChange={(e) => setOnboardingPlan(e.target.value)}
            rows={8}
            placeholder="Describe the onboarding plan..."
          />
        </div>
      </div>
    </div>
  );
}
