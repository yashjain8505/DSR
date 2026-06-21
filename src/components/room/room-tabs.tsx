"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ALWAYS_VISIBLE_TABS,
  MAIN_TAB_LABELS,
  OVERVIEW_SUB_TAB_KEYS,
  type MainTabKey,
  type OverviewSubTabKey,
} from "@/lib/constants";
import { TabMeetingBrief } from "@/components/room/tab-meeting-brief";
import { TabNextSteps } from "@/components/room/tab-next-steps";
import { TabPricing } from "@/components/room/tab-pricing";
import { TabCaseStudies } from "@/components/room/tab-case-studies";
import { TabComparisons } from "@/components/room/tab-comparisons";
import { TabGettingStarted } from "@/components/room/tab-getting-started";
import { CustomersReferences } from "@/components/room/customers-references";
import { SubTabContent } from "@/components/room/tab-overview";
import type { Asset, OverviewSubTab, RoomWithContent } from "@/lib/types";

interface RoomTabsProps {
  data: RoomWithContent;
  visitorId: string | null;
}

function isOverviewTab(tab: MainTabKey): tab is OverviewSubTabKey {
  return (OVERVIEW_SUB_TAB_KEYS as readonly string[]).includes(tab);
}

/**
 * Prospect room content: every section is stacked into one continuous scroll.
 * The left rail is a sticky, numbered page index (p.01, p.02 …) that highlights
 * the section currently in view (scroll-spy) and scrolls to a section on click.
 */
export function RoomTabs({ data, visitorId }: RoomTabsProps) {
  const visibleTabs = computeVisibleTabs(data);
  const [activeTab, setActiveTab] = useState<MainTabKey>(visibleTabs[0]);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Scroll-spy: the section nearest the middle of the viewport is "active".
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveTab(visible[0].target.id as MainTabKey);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    visibleTabs.forEach((t) => {
      const el = sectionRefs.current[t];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTabs.join("|")]);

  function scrollTo(tab: MainTabKey) {
    sectionRefs.current[tab]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveTab(tab);
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: data.room.id,
        visitor_id: visitorId,
        event_type: "tab_click",
        event_data: { tab },
      }),
    }).catch(() => {});
  }

  function getOverviewTab(tab: OverviewSubTabKey): OverviewSubTab | null {
    return data.overview_sub_tabs.find((t) => t.sub_tab_key === tab) ?? null;
  }

  function renderSection(tab: MainTabKey) {
    if (tab === "meeting_brief") {
      return (
        <div className="space-y-10">
          <TabMeetingBrief meetingBrief={data.meeting_brief} />
          <TabNextSteps
            nextSteps={data.meeting_brief?.next_steps ?? ""}
            customerLogoUrl={data.room.logo_url}
            customerName={data.room.company_name}
          />
        </div>
      );
    }
    if (isOverviewTab(tab)) {
      return (
        <OverviewTabRenderer
          subTab={getOverviewTab(tab)}
          assets={data.assets}
        />
      );
    }
    if (tab === "pricing") {
      return (
        <TabPricing
          pricing={data.pricing}
          companyName={data.room.company_name}
        />
      );
    }
    if (tab === "customers_references") {
      return (
        <div className="space-y-12">
          <CustomersReferences references={data.customer_references} />
          {data.case_studies.length > 0 && (
            <TabCaseStudies caseStudies={data.case_studies} />
          )}
        </div>
      );
    }
    if (tab === "comparison") {
      return (
        <TabComparisons
          competitors={
            data.room.comparison_competitors ?? ["appsflyer", "adjust", "branch"]
          }
        />
      );
    }
    if (tab === "getting_started") {
      return <TabGettingStarted gettingStarted={data.getting_started} />;
    }
    return null;
  }

  const num = (i: number) => `p.${String(i + 1).padStart(2, "0")}`;

  return (
    <div className="flex flex-col lg:flex-row lg:gap-8">
      {/* ---- Desktop: numbered page index (sticky) ---- */}
      <nav
        className="hidden lg:sticky lg:top-4 lg:flex lg:max-h-[calc(100dvh-2rem)] lg:w-64 lg:shrink-0 lg:flex-col lg:gap-0.5 lg:self-start lg:overflow-y-auto lg:pr-2 lg:pt-2"
        aria-label="Room pages"
      >
        {visibleTabs.map((tab, i) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => scrollTo(tab)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                active ? "" : "hover:bg-black/[0.04]",
              )}
              style={
                active
                  ? { backgroundColor: "var(--brand-primary-light, #eef2ff)" }
                  : undefined
              }
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                <span
                  className="h-2 w-2 rounded-full transition-all"
                  style={
                    active
                      ? {
                          backgroundColor: "var(--brand-primary)",
                          boxShadow:
                            "0 0 0 4px color-mix(in srgb, var(--brand-primary) 20%, transparent)",
                        }
                      : { backgroundColor: "#cbd5e1" }
                  }
                />
              </span>
              <span
                className="font-mono text-xs"
                style={{
                  color: active ? "var(--brand-primary)" : "#9ca3af",
                }}
              >
                {num(i)}
              </span>
              <span
                className={cn(
                  "text-sm",
                  active
                    ? "font-bold text-gray-900"
                    : "text-gray-600 group-hover:text-gray-900",
                )}
              >
                {MAIN_TAB_LABELS[tab]}
              </span>
            </button>
          );
        })}

        <div className="mt-4 border-t border-gray-200 pt-3">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Powered by
          </p>
          <p className="px-3 text-sm font-bold text-gray-900">Linkrunner</p>
        </div>
      </nav>

      {/* ---- Mobile: sticky horizontal page bar ---- */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-gray-200 bg-gray-100/95 px-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:hidden">
        {visibleTabs.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => scrollTo(tab)}
              className={cn(
                "relative shrink-0 whitespace-nowrap px-3 py-3 text-sm transition-colors",
                active ? "font-semibold text-gray-900" : "text-gray-500",
              )}
            >
              {MAIN_TAB_LABELS[tab]}
              {active && (
                <span
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ---- Stacked, scrollable sections ---- */}
      <div className="min-w-0 flex-1">
        {visibleTabs.map((tab, i) => (
          <section
            key={tab}
            id={tab}
            ref={(el) => {
              sectionRefs.current[tab] = el;
            }}
            className={cn(
              "scroll-mt-4 py-8 lg:py-10",
              i < visibleTabs.length - 1 && "border-b border-gray-200/70",
            )}
          >
            {renderSection(tab)}
          </section>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function OverviewTabRenderer({
  subTab,
  assets = [],
}: {
  subTab: OverviewSubTab | null;
  assets?: Asset[];
}) {
  if (!subTab) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        Content coming soon.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <SubTabContent subTab={subTab} assets={assets} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function computeVisibleTabs(data: RoomWithContent): MainTabKey[] {
  const tabs: MainTabKey[] = [...ALWAYS_VISIBLE_TABS];

  if (
    data.room.tab_customers_references_visible ||
    data.room.tab_case_studies_visible
  ) {
    tabs.push("customers_references");
  }
  if (data.room.tab_comparison_visible) {
    tabs.push("comparison");
  }
  if (data.room.tab_getting_started_visible) {
    tabs.push("getting_started");
  }

  return tabs;
}
