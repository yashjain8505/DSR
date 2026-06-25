"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
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

/** Sub-items shown under the Recap page in the index. */
const RECAP_SUBS = [
  { id: "recap_discussed", label: "What we discussed so far" },
  { id: "recap_next_steps", label: "Next Steps" },
] as const;

/**
 * Prospect room content: every section is stacked into one continuous scroll.
 * The left rail is a sticky, numbered page index (p.01, p.02 …) that highlights
 * the section currently in view (scroll-spy) and scrolls to a section on click.
 */
export function RoomTabs({ data, visitorId }: RoomTabsProps) {
  const visibleTabs = computeVisibleTabs(data);
  const [activeTab, setActiveTab] = useState<MainTabKey>(visibleTabs[0]);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const hidden = new Set(data.room.hidden_sections ?? []);
  const recapSubs = RECAP_SUBS.filter((s) => !hidden.has(s.id));

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

  // Log which sections the visitor actually views — by scroll OR nav click.
  // Debounced so a quick scroll-through doesn't spam, and deduped so the same
  // section in a row isn't logged twice. This powers the activity timeline
  // ("Viewed Pricing", "Viewed Features", ...) on the analytics drilldown.
  const lastTracked = useRef<MainTabKey | null>(null);
  useEffect(() => {
    if (!activeTab) return;
    const t = setTimeout(() => {
      if (lastTracked.current === activeTab) return;
      lastTracked.current = activeTab;
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: data.room.id,
          visitor_id: visitorId,
          event_type: "tab_click",
          event_data: { tab: activeTab },
        }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [activeTab, data.room.id, visitorId]);

  function scrollTo(tab: MainTabKey) {
    sectionRefs.current[tab]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveTab(tab);
    // Emission is handled by the debounced activeTab effect above, so a click
    // and the scroll it triggers don't double-log.
  }

  function scrollToId(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function getOverviewTab(tab: OverviewSubTabKey): OverviewSubTab | null {
    return data.overview_sub_tabs.find((t) => t.sub_tab_key === tab) ?? null;
  }

  function renderSection(tab: MainTabKey) {
    if (tab === "meeting_brief") {
      return (
        <div className="space-y-10">
          {!hidden.has("recap_discussed") && (
            <div id="recap_discussed" className="scroll-mt-4">
              <TabMeetingBrief meetingBrief={data.meeting_brief} />
            </div>
          )}
          {!hidden.has("recap_next_steps") && (
            <div id="recap_next_steps" className="scroll-mt-4">
              <TabNextSteps
                nextSteps={data.meeting_brief?.next_steps ?? ""}
                customerLogoUrl={data.room.logo_url}
                customerName={data.room.company_name}
              />
            </div>
          )}
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
        className="hidden lg:sticky lg:top-4 lg:flex lg:h-[calc(100dvh-2rem)] lg:w-64 lg:shrink-0 lg:flex-col lg:gap-0.5 lg:self-start lg:overflow-y-auto lg:border-r lg:border-gray-300 lg:px-2 lg:py-3 lg:pr-4"
        aria-label="Room pages"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      >
        {visibleTabs.map((tab, i) => {
          const active = activeTab === tab;
          return (
            <div key={tab}>
              <button
                type="button"
                onClick={() => scrollTo(tab)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
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
                  style={{ color: active ? "var(--brand-primary)" : "#9ca3af" }}
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

              {tab === "meeting_brief" && recapSubs.length > 0 && (
                <div className="ml-[26px] mt-0.5 flex flex-col gap-0.5 border-l border-gray-300/70 pl-3">
                  {recapSubs.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => scrollToId(s.id)}
                      className="rounded-md px-2 py-1 text-left text-[13px] text-gray-500 transition-colors hover:bg-black/[0.04] hover:text-gray-800"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-auto pt-4">
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
              "scroll-mt-4 py-10 lg:py-14",
              i > 0 && "border-t-2 border-gray-900",
            )}
          >
            {/* Section eyebrow — clear marker for the start of each page */}
            <div className="mb-8 flex items-center gap-2.5">
              <span
                className="font-mono text-xs font-bold"
                style={{ color: "var(--brand-primary)" }}
              >
                {num(i)}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-700">
                {MAIN_TAB_LABELS[tab]}
              </span>
            </div>
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
  const hidden = new Set(data.room.hidden_sections ?? []);
  // Fixed order; Integrations / Security & Compliance / How It Works pinned last.
  const order: MainTabKey[] = [
    "meeting_brief",
    "what_is_linkrunner",
    "product_demo",
    "features",
    "company_deck",
    "pricing",
    "customers_references",
    "comparison",
    "integrations",
    "security_compliance",
    "how_it_works",
  ];
  return order.filter((t) => {
    if (t === "meeting_brief") {
      // Recap shows if at least one of its sub-pages is visible.
      return !(hidden.has("recap_discussed") && hidden.has("recap_next_steps"));
    }
    return !hidden.has(t);
  });
}
