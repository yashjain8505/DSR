"use client";

import { useState } from "react";
import {
  BadgeCheck,
  BookOpen,
  Boxes,
  CreditCard,
  FileText,
  GitCompareArrows,
  HelpCircle,
  MonitorPlay,
  PlayCircle,
  Plug,
  Presentation,
  ShieldCheck,

  Users,
  Workflow,
  ChevronDown,
} from "lucide-react";
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

const TAB_ICONS: Record<MainTabKey, React.ElementType> = {
  meeting_brief: FileText,
  what_is_linkrunner: HelpCircle,
  product_demo: MonitorPlay,
  features: Boxes,
  how_it_works: Workflow,
  company_deck: Presentation,

  integrations: Plug,
  security_compliance: ShieldCheck,
  customers_references: Users,
  pricing: CreditCard,
  case_studies: BookOpen,
  comparison: GitCompareArrows,
  getting_started: PlayCircle,
};

/** Sub-items for the "Recap" tab. */
const RECAP_SUB_ITEMS = [
  { key: "what_we_discussed", label: "What we discussed so far" },
  { key: "next_steps", label: "Next Steps" },
] as const;

type RecapSubKey = (typeof RECAP_SUB_ITEMS)[number]["key"];

function isOverviewTab(tab: MainTabKey): tab is OverviewSubTabKey {
  return (OVERVIEW_SUB_TAB_KEYS as readonly string[]).includes(tab);
}

/**
 * Main tab navigation for the prospect-facing room.
 * All content sections are first-class tabs; Recap alone keeps its sub-items.
 */
export function RoomTabs({ data, visitorId }: RoomTabsProps) {
  const visibleTabs = computeVisibleTabs(data);
  const [activeTab, setActiveTab] = useState<MainTabKey>(visibleTabs[0]);
  const [activeRecapSub, setActiveRecapSub] =
    useState<RecapSubKey>("what_we_discussed");
  const [recapExpanded, setRecapExpanded] = useState(true);
  const [mobileRecapOpen, setMobileRecapOpen] = useState(false);

  function handleTabChange(tab: MainTabKey) {
    setActiveTab(tab);
    setMobileRecapOpen(false);
    if (tab === "meeting_brief") {
      setRecapExpanded((expanded) => !expanded);
    } else {
      setRecapExpanded(false);
    }
    trackTabClick(tab);
  }

  function handleMobileTabClick(tab: MainTabKey) {
    setActiveTab(tab);
    if (tab === "meeting_brief") {
      setMobileRecapOpen((open) => !open);
    } else {
      setMobileRecapOpen(false);
    }
    trackTabClick(tab);
  }

  function handleRecapSubClick(subKey: RecapSubKey) {
    setActiveTab("meeting_brief");
    setActiveRecapSub(subKey);
    setRecapExpanded(true);
    setMobileRecapOpen(false);
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

  function getOverviewTab(tab: OverviewSubTabKey): OverviewSubTab | null {
    return data.overview_sub_tabs.find((t) => t.sub_tab_key === tab) ?? null;
  }

  return (
    <div className="flex flex-col lg:flex-row lg:gap-8">
      {/* ---- Desktop sidebar ---- */}
      <nav
        className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:gap-0.5 lg:pr-6 lg:pt-2"
        aria-label="Room tabs"
      >
        {visibleTabs.map((tab) => {
          const Icon = TAB_ICONS[tab] ?? BadgeCheck;
          const isActive = activeTab === tab;
          const isRecap = tab === "meeting_brief";
          const isExpanded = isRecap && isActive && recapExpanded;

          return (
            <div key={tab}>
              <button
                type="button"
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
                  isActive
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-gray-700" : "text-gray-400",
                  )}
                />
                <span className="flex-1">{MAIN_TAB_LABELS[tab]}</span>
                {isRecap && (
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200",
                      isExpanded && "rotate-180",
                    )}
                  />
                )}
              </button>

              {isRecap && isExpanded && (
                <div className="ml-7 mt-0.5 flex flex-col gap-0.5 pb-1 pl-3">
                  {RECAP_SUB_ITEMS.map((item) => {
                    const isSubActive = activeRecapSub === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleRecapSubClick(item.key)}
                        className={cn(
                          "rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
                          isSubActive
                            ? "bg-white font-medium text-gray-900 shadow-sm"
                            : "text-gray-500 hover:bg-gray-200/70 hover:text-gray-800",
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
          className="flex gap-1 overflow-x-auto scrollbar-hide"
          aria-label="Room tabs"
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab;
            const isRecap = tab === "meeting_brief";

            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleMobileTabClick(tab)}
                className={cn(
                  "relative flex shrink-0 items-center gap-1 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-inset",
                  isActive
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                {MAIN_TAB_LABELS[tab]}
                {isRecap && (
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      mobileRecapOpen && "rotate-180",
                    )}
                  />
                )}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-gray-900" />
                )}
              </button>
            );
          })}
        </nav>

        {mobileRecapOpen && (
          <div className="absolute left-0 right-0 z-20 bg-white shadow-md">
            <div className="flex flex-col px-2 py-1">
              {RECAP_SUB_ITEMS.map((item) => {
                const isSubActive =
                  activeRecapSub === item.key && activeTab === "meeting_brief";
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleRecapSubClick(item.key)}
                    className={cn(
                      "rounded-md px-4 py-2.5 text-left text-sm transition-colors",
                      isSubActive
                        ? "bg-gray-100 font-medium text-gray-900"
                        : "text-gray-600 hover:bg-gray-50",
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
        {activeTab === "meeting_brief" &&
          activeRecapSub === "what_we_discussed" && (
            <TabMeetingBrief meetingBrief={data.meeting_brief} />
          )}
        {activeTab === "meeting_brief" && activeRecapSub === "next_steps" && (
          <TabNextSteps
            nextSteps={data.meeting_brief?.next_steps ?? ""}
            customerLogoUrl={data.room.logo_url}
            customerName={data.room.company_name}
          />
        )}
        {isOverviewTab(activeTab) && (
          <OverviewTabRenderer
            subTab={getOverviewTab(activeTab)}
            assets={data.assets}
            companyName={data.room.company_name}
          />
        )}
        {activeTab === "customers_references" && (
          <CustomersReferences references={data.customer_references} />
        )}
        {activeTab === "pricing" && (
          <TabPricing pricing={data.pricing} companyName={data.room.company_name} />
        )}
        {activeTab === "case_studies" && (
          <TabCaseStudies caseStudies={data.case_studies} />
        )}
        {activeTab === "comparison" && (
          <TabComparisons competitors={data.room.comparison_competitors ?? ["appsflyer", "adjust", "branch"]} />
        )}
        {activeTab === "getting_started" && (
          <TabGettingStarted gettingStarted={data.getting_started} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function OverviewTabRenderer({
  subTab,
  assets = [],
  companyName,
}: {
  subTab: OverviewSubTab | null;
  assets?: Asset[];
  companyName: string;
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
      <SubTabContent
        subTab={subTab}
        assets={assets}
        companyName={companyName}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function computeVisibleTabs(data: RoomWithContent): MainTabKey[] {
  const tabs: MainTabKey[] = [...ALWAYS_VISIBLE_TABS];

  if (data.room.tab_customers_references_visible) {
    tabs.push("customers_references");
  }
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
