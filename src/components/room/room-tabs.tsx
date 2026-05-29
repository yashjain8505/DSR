"use client";

import { useState } from "react";
import {
  FileText,
  Package,
  Sparkles,
  CreditCard,
  BookOpen,
  GitCompareArrows,
  PlayCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ALWAYS_VISIBLE_TABS,
  MAIN_TAB_LABELS,
  PRODUCT_SUB_TABS,
  WHY_LINKRUNNER_SUB_TABS,
  OVERVIEW_SUB_TAB_LABELS,
  type MainTabKey,
  type OverviewSubTabKey,
} from "@/lib/constants";
import { TabMeetingBrief } from "@/components/room/tab-meeting-brief";
import { TabNextSteps } from "@/components/room/tab-next-steps";
import { TabPricing } from "@/components/room/tab-pricing";
import { TabCaseStudies } from "@/components/room/tab-case-studies";
import { TabComparisons } from "@/components/room/tab-comparisons";
import { TabGettingStarted } from "@/components/room/tab-getting-started";
import { SubTabContent } from "@/components/room/tab-overview";
import type { RoomWithContent, OverviewSubTab } from "@/lib/types";

interface RoomTabsProps {
  data: RoomWithContent;
  visitorId: string | null;
}

const TAB_ICONS: Record<MainTabKey, React.ElementType> = {
  meeting_brief: FileText,
  product: Package,
  why_linkrunner: Sparkles,
  pricing: CreditCard,
  case_studies: BookOpen,
  comparison: GitCompareArrows,
  getting_started: PlayCircle,
};

/** Sub-items for the "Recap" (meeting_brief) tab. */
const RECAP_SUB_ITEMS = [
  { key: "what_we_discussed", label: "What we discussed so far" },
  { key: "next_steps", label: "Next Steps" },
] as const;

type RecapSubKey = (typeof RECAP_SUB_ITEMS)[number]["key"];

/** Tabs that have expandable sub-tab dropdowns (overview-based). */
const EXPANDABLE_TABS: Partial<Record<MainTabKey, readonly OverviewSubTabKey[]>> = {
  product: PRODUCT_SUB_TABS,
  why_linkrunner: WHY_LINKRUNNER_SUB_TABS,
};

/** Tabs that have their own custom expandable sub-items. */
const CUSTOM_EXPANDABLE_TABS: MainTabKey[] = ["meeting_brief"];

function isExpandable(tab: MainTabKey): boolean {
  return !!EXPANDABLE_TABS[tab] || CUSTOM_EXPANDABLE_TABS.includes(tab);
}

/**
 * Main tab navigation for the prospect-facing room.
 * Desktop: vertical sidebar with expandable sub-tabs.
 * Mobile: horizontal scrollable tabs with dropdown for sub-tabs.
 */
export function RoomTabs({ data, visitorId }: RoomTabsProps) {
  const visibleTabs = computeVisibleTabs(data);
  const [activeTab, setActiveTab] = useState<MainTabKey>(visibleTabs[0]);
  const [activeSubTab, setActiveSubTab] = useState<OverviewSubTabKey>(
    PRODUCT_SUB_TABS[0]
  );
  const [activeRecapSub, setActiveRecapSub] = useState<RecapSubKey>("what_we_discussed");
  const [expandedTab, setExpandedTab] = useState<MainTabKey | null>("meeting_brief");
  // Mobile dropdown open state
  const [mobileDropdownTab, setMobileDropdownTab] = useState<MainTabKey | null>(null);

  function handleTabChange(tab: MainTabKey) {
    const subTabs = EXPANDABLE_TABS[tab];
    const isCustomExpandable = CUSTOM_EXPANDABLE_TABS.includes(tab);

    if (subTabs) {
      if (activeTab === tab) {
        setExpandedTab(expandedTab === tab ? null : tab);
      } else {
        setActiveTab(tab);
        setActiveSubTab(subTabs[0]);
        setExpandedTab(tab);
      }
    } else if (isCustomExpandable) {
      if (activeTab === tab) {
        setExpandedTab(expandedTab === tab ? null : tab);
      } else {
        setActiveTab(tab);
        setExpandedTab(tab);
      }
    } else {
      setActiveTab(tab);
      setExpandedTab(null);
      setMobileDropdownTab(null);
    }
    trackTabClick(tab);
  }

  function handleSubTabClick(parentTab: MainTabKey, subTabKey: OverviewSubTabKey) {
    setActiveTab(parentTab);
    setActiveSubTab(subTabKey);
    setMobileDropdownTab(null);
    trackSubTabClick(subTabKey);
  }

  function handleRecapSubClick(subKey: RecapSubKey) {
    setActiveTab("meeting_brief");
    setActiveRecapSub(subKey);
    setMobileDropdownTab(null);
  }

  function handleMobileTabClick(tab: MainTabKey) {
    const subTabs = EXPANDABLE_TABS[tab];
    const isCustomExpandable = CUSTOM_EXPANDABLE_TABS.includes(tab);

    if (subTabs || isCustomExpandable) {
      if (mobileDropdownTab === tab) {
        setMobileDropdownTab(null);
      } else {
        setMobileDropdownTab(tab);
        if (activeTab !== tab) {
          setActiveTab(tab);
          if (subTabs) setActiveSubTab(subTabs[0]);
        }
      }
    } else {
      setActiveTab(tab);
      setMobileDropdownTab(null);
    }
    trackTabClick(tab);
  }

  function trackTabClick(tab: MainTabKey) {
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

  function trackSubTabClick(subTabKey: OverviewSubTabKey) {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: data.room.id,
        visitor_id: visitorId,
        event_type: "sub_tab_click",
        event_data: { sub_tab_key: subTabKey },
      }),
    }).catch(() => {});
  }

  /** Find the OverviewSubTab data for the current active sub-tab. */
  function getActiveOverviewSubTab(): OverviewSubTab | null {
    if (activeTab !== "product" && activeTab !== "why_linkrunner") return null;
    return data.overview_sub_tabs.find((t) => t.sub_tab_key === activeSubTab) ?? null;
  }

  return (
    <div className="flex flex-col lg:flex-row lg:gap-8">
      {/* ---- Desktop sidebar ---- */}
      <nav
        className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:gap-0.5 lg:border-r lg:pr-6 lg:pt-2"
        style={{ borderColor: "color-mix(in srgb, var(--brand-primary) 20%, #e5e7eb)" }}
        aria-label="Room tabs"
      >
        {visibleTabs.map((tab) => {
          const Icon = TAB_ICONS[tab];
          const isActive = activeTab === tab;
          const subTabKeys = EXPANDABLE_TABS[tab];
          const isCustomExpandable = CUSTOM_EXPANDABLE_TABS.includes(tab);
          const isExpanded = expandedTab === tab && isActive;

          return (
            <div key={tab}>
              <button
                type="button"
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
                  isActive
                    ? "bg-[var(--brand-primary-light)] text-[var(--brand-primary)]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-[var(--brand-primary)]" : "text-gray-400"
                  )}
                />
                <span className="flex-1">{MAIN_TAB_LABELS[tab]}</span>
                {(subTabKeys || isCustomExpandable) && (
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                      isActive ? "text-[var(--brand-primary)]" : "text-gray-400",
                      isExpanded && "rotate-180"
                    )}
                  />
                )}
              </button>

              {/* Expanded overview sub-tabs */}
              {subTabKeys && isExpanded && (
                <div className="ml-7 mt-0.5 flex flex-col gap-0.5 border-l-2 border-[var(--brand-primary-light)] pl-3 pb-1">
                  {subTabKeys.map((subKey) => {
                    const isSubActive = activeSubTab === subKey;
                    const label = OVERVIEW_SUB_TAB_LABELS[subKey];
                    return (
                      <button
                        key={subKey}
                        type="button"
                        onClick={() => handleSubTabClick(tab, subKey)}
                        className={cn(
                          "rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
                          isSubActive
                            ? "font-medium text-[var(--brand-primary)] bg-[var(--brand-primary-light)]"
                            : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Expanded recap sub-items */}
              {isCustomExpandable && tab === "meeting_brief" && isExpanded && (
                <div className="ml-7 mt-0.5 flex flex-col gap-0.5 border-l-2 border-[var(--brand-primary-light)] pl-3 pb-1">
                  {RECAP_SUB_ITEMS.map((item) => {
                    const isSubActive = activeRecapSub === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleRecapSubClick(item.key)}
                        className={cn(
                          "rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
                          isSubActive
                            ? "font-medium text-[var(--brand-primary)] bg-[var(--brand-primary-light)]"
                            : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ---- Mobile horizontal tabs ---- */}
      <div className="relative lg:hidden">
        <nav
          className="flex gap-1 overflow-x-auto border-b scrollbar-hide"
          style={{ borderColor: "color-mix(in srgb, var(--brand-primary) 20%, #e5e7eb)" }}
          aria-label="Room tabs"
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab;
            const subTabKeys = EXPANDABLE_TABS[tab];
            const isCustomExpandable = CUSTOM_EXPANDABLE_TABS.includes(tab);
            const hasDropdown = subTabKeys || isCustomExpandable;
            const isDropdownOpen = mobileDropdownTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleMobileTabClick(tab)}
                className={cn(
                  "relative flex shrink-0 items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-inset",
                  isActive
                    ? "text-[var(--brand-primary)]"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {MAIN_TAB_LABELS[tab]}
                {hasDropdown && (
                  <ChevronDown
                    className={cn(
                      "h-3 w-3",
                      isDropdownOpen && "rotate-180",
                      "transition-transform duration-200"
                    )}
                  />
                )}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--brand-primary)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile dropdown for overview sub-tabs */}
        {mobileDropdownTab && EXPANDABLE_TABS[mobileDropdownTab] && (
          <div className="absolute left-0 right-0 z-20 border-b border-gray-200 bg-white shadow-md">
            <div className="flex flex-col px-2 py-1">
              {EXPANDABLE_TABS[mobileDropdownTab]!.map((subKey) => {
                const isSubActive = activeSubTab === subKey && activeTab === mobileDropdownTab;
                const label = OVERVIEW_SUB_TAB_LABELS[subKey];
                return (
                  <button
                    key={subKey}
                    type="button"
                    onClick={() => handleSubTabClick(mobileDropdownTab, subKey)}
                    className={cn(
                      "rounded-md px-4 py-2.5 text-left text-sm transition-colors",
                      isSubActive
                        ? "font-medium text-[var(--brand-primary)] bg-[var(--brand-primary-light)]"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile dropdown for recap sub-items */}
        {mobileDropdownTab === "meeting_brief" && (
          <div className="absolute left-0 right-0 z-20 border-b border-gray-200 bg-white shadow-md">
            <div className="flex flex-col px-2 py-1">
              {RECAP_SUB_ITEMS.map((item) => {
                const isSubActive = activeRecapSub === item.key && activeTab === "meeting_brief";
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleRecapSubClick(item.key)}
                    className={cn(
                      "rounded-md px-4 py-2.5 text-left text-sm transition-colors",
                      isSubActive
                        ? "font-medium text-[var(--brand-primary)] bg-[var(--brand-primary-light)]"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ---- Tab content ---- */}
      <div className="min-w-0 flex-1 py-6 lg:py-2">
        {activeTab === "meeting_brief" && activeRecapSub === "what_we_discussed" && (
          <TabMeetingBrief meetingBrief={data.meeting_brief} />
        )}
        {activeTab === "meeting_brief" && activeRecapSub === "next_steps" && (
          <TabNextSteps nextSteps={data.meeting_brief?.next_steps ?? ""} />
        )}
        {(activeTab === "product" || activeTab === "why_linkrunner") && (
          <OverviewSubTabRenderer subTab={getActiveOverviewSubTab()} assets={data.assets} />
        )}
        {activeTab === "pricing" && <TabPricing pricing={data.pricing} />}
        {activeTab === "case_studies" && (
          <TabCaseStudies caseStudies={data.case_studies} />
        )}
        {activeTab === "comparison" && (
          <TabComparisons comparisons={data.comparisons} />
        )}
        {activeTab === "getting_started" && (
          <TabGettingStarted gettingStarted={data.getting_started} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function OverviewSubTabRenderer({
  subTab,
  assets = [],
}: {
  subTab: OverviewSubTab | null;
  assets?: import("@/lib/types").Asset[];
}) {
  if (!subTab) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        Content coming soon.
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-4xl">
      <SubTabContent subTab={subTab} assets={assets} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function computeVisibleTabs(data: RoomWithContent): MainTabKey[] {
  const tabs: MainTabKey[] = [...ALWAYS_VISIBLE_TABS];

  if (data.room.tab_case_studies_visible) {
    tabs.push("case_studies");
  }
  if (data.room.tab_comparison_visible) {
    tabs.push("comparison");
  }
  if (data.room.tab_getting_started_visible) {
    tabs.push("getting_started");
  }

  return tabs;
}
