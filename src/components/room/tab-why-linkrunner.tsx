"use client";

import { WHY_LINKRUNNER_SUB_TABS } from "@/lib/constants";
import { SubTabDropdownSection } from "@/components/room/tab-overview";
import type { OverviewSubTab } from "@/lib/types";

interface TabWhyLinkrunnerProps {
  subTabs: OverviewSubTab[];
  roomId: string;
  visitorId: string | null;
}

/**
 * Why Linkrunner tab — filters overview sub-tabs to:
 * What Makes Us Different, Integrations, Our Customers & References, Security & Compliance.
 * Uses a dropdown selector instead of horizontal tabs.
 */
export function TabWhyLinkrunner({
  subTabs,
  roomId,
  visitorId,
}: TabWhyLinkrunnerProps) {
  const whySubTabs = subTabs.filter((t) =>
    (WHY_LINKRUNNER_SUB_TABS as readonly string[]).includes(t.sub_tab_key)
  );

  return (
    <SubTabDropdownSection
      subTabs={whySubTabs}
      roomId={roomId}
      visitorId={visitorId}
    />
  );
}
