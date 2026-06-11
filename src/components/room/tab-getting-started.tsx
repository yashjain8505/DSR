import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { Clock, ArrowRightLeft, Rocket } from "lucide-react";
import type { GettingStarted } from "@/lib/types";

interface TabGettingStartedProps {
  gettingStarted: GettingStarted;
}

const SECTIONS = [
  {
    key: "integration_timeline" as const,
    title: "Integration Timeline",
    description: "How long it takes to get up and running",
    icon: Clock,
  },
  {
    key: "migration_steps" as const,
    title: "Migration Steps",
    description: "Moving from your current solution",
    icon: ArrowRightLeft,
  },
  {
    key: "onboarding_plan" as const,
    title: "Onboarding Plan",
    description: "Your personalised onboarding journey",
    icon: Rocket,
  },
] as const;

/**
 * Getting Started tab. Renders three clearly-separated sections
 * with icons: Integration Timeline, Migration Steps, Onboarding Plan.
 */
export function TabGettingStarted({ gettingStarted }: TabGettingStartedProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Getting Started</h2>
        <p className="mt-1 text-sm text-gray-500">
          Everything you need to get live with Linkrunner
        </p>
      </div>

      <div className="space-y-8">
        {SECTIONS.map((section) => {
          const content = gettingStarted[section.key];
          if (!content) return null;

          const Icon = section.icon;

          return (
            <div
              key={section.key}
              className="rounded-xl bg-white overflow-hidden"
            >
              {/* Section header */}
              <div className="flex items-center gap-4 bg-gray-50 px-6 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-gray-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {section.description}
                  </p>
                </div>
              </div>

              {/* Section content */}
              <div className="p-6">
                <MarkdownRenderer content={content} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
