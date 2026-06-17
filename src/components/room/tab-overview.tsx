"use client";

import { useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { YouTubeEmbed } from "@/components/room/youtube-embed";
import { IframeEmbed } from "@/components/room/iframe-embed";
import { SecurityCompliance } from "@/components/room/security-compliance";
import { IntegrationsPage } from "@/components/room/integrations";
import { FeaturesBento } from "@/components/room/features-bento";
import { WhatIsLinkrunner } from "@/components/room/what-is-linkrunner";
import { HowItWorks } from "@/components/room/how-it-works";
import { OVERVIEW_SUB_TAB_LABELS } from "@/lib/constants";
import type { OverviewSubTab, Asset } from "@/lib/types";
import type { OverviewSubTabKey } from "@/lib/constants";

interface SubTabDropdownSectionProps {
  subTabs: OverviewSubTab[];
  roomId: string;
  visitorId: string | null;
}

/**
 * Reusable section that renders a dropdown selector for sub-tabs
 * and the selected sub-tab's content below.
 */
export function SubTabDropdownSection({
  subTabs,
  roomId,
  visitorId,
}: SubTabDropdownSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>(
    subTabs[0]?.sub_tab_key ?? ""
  );

  if (subTabs.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        No content available yet.
      </div>
    );
  }

  const activeTab = subTabs.find((t) => t.sub_tab_key === activeSubTab);

  function handleSubTabChange(key: string) {
    setActiveSubTab(key);
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: roomId,
        visitor_id: visitorId,
        event_type: "sub_tab_click",
        event_data: { sub_tab_key: key },
      }),
    }).catch(() => {
      /* analytics is best-effort */
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Dropdown selector */}
      <div className="relative mb-6 w-full sm:w-72">
        <select
          value={activeSubTab}
          onChange={(e) => handleSubTabChange(e.target.value)}
          className="w-full appearance-none rounded-lg bg-white px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          {subTabs.map((tab) => {
            const label =
              OVERVIEW_SUB_TAB_LABELS[tab.sub_tab_key as OverviewSubTabKey] ??
              tab.title;
            return (
              <option key={tab.sub_tab_key} value={tab.sub_tab_key}>
                {label}
              </option>
            );
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Sub-tab content */}
      {activeTab && <SubTabContent subTab={activeTab} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function SubTabContent({
  subTab,
  assets = [],
}: {
  subTab: OverviewSubTab;
  assets?: Asset[];
}) {
  const asset = assets.find((a) => a.category === subTab.sub_tab_key);
  const content = subTab.content || asset?.content || "";
  const youtubeUrl = subTab.youtube_url || asset?.url || "";

  switch (subTab.sub_tab_key) {
    case "product_demo":
      return youtubeUrl ? (
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
          <YouTubeEmbed url={youtubeUrl} title="Product Demo" />
          {content && (
            <div className="mt-6">
              <MarkdownRenderer content={content} />
            </div>
          )}
        </div>
      ) : (
        <FallbackContent content={content} />
      );

    case "security_compliance":
      return <SecurityCompliance />;

    case "integrations":
      return <IntegrationsPage />;

    case "company_deck": {
      // Render every deck in the company_deck category in sort order
      // (Pitch Deck first, then Onboarding Deck), each as its own labelled block.
      const decks = assets
        .filter((a) => a.category === "company_deck" && a.url)
        .sort((a, b) => a.sort_order - b.sort_order);
      const fallbackUrl = subTab.iframe_url || asset?.url || "";
      if (decks.length === 0) {
        return fallbackUrl ? (
          <DeckBlock title="Company Deck" url={fallbackUrl} />
        ) : (
          <FallbackContent content={content} />
        );
      }
      return (
        <div className="space-y-8">
          {decks.map((d) => (
            <DeckBlock key={d.id} title={d.title} url={d.url as string} />
          ))}
          {content && (
            <div className="mt-2">
              <MarkdownRenderer content={content} />
            </div>
          )}
        </div>
      );
    }

    case "what_is_linkrunner":
      return <WhatIsLinkrunner />;

    case "features":
      return <FeaturesBento />;

    case "how_it_works":
      return <HowItWorks />;

    default:
      return <FallbackContent content={content} />;
  }
}

/**
 * Renders a PDF by proxying it through our own API so it's same-origin.
 * This avoids all cross-origin iframe/embed/object blocking issues.
 */
function PdfEmbed({ url, title }: { url: string; title: string }) {
  const proxyUrl = `/api/assets/proxy?url=${encodeURIComponent(url)}#toolbar=0&navpanes=0&view=Fit`;

  return (
    <div className="w-full overflow-hidden rounded-lg">
      <iframe
        src={proxyUrl}
        className="h-[700px] w-full border-0"
        title={title}
      />
    </div>
  );
}


/** A single labelled deck: heading + download button + same-origin PDF embed. */
function DeckBlock({ title, url }: { title: string; url: string }) {
  const isPdf =
    url.toLowerCase().endsWith(".pdf") || url.includes("/assets/");
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {isPdf && (
          <a
            href={url}
            download
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        )}
      </div>
      {isPdf ? (
        <PdfEmbed url={url} title={title} />
      ) : (
        <IframeEmbed url={url} height={700} title={title} />
      )}
    </div>
  );
}

function FallbackContent({ content }: { content: string }) {
  if (!content) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        Content coming soon.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <MarkdownRenderer content={content} />
    </div>
  );
}

/* How It Works now renders the dedicated <HowItWorks /> component above. */
