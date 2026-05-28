"use client";

import { PRODUCT_SUB_TABS } from "@/lib/constants";
import { SubTabDropdownSection } from "@/components/room/tab-overview";
import type { OverviewSubTab } from "@/lib/types";

interface TabProductProps {
  subTabs: OverviewSubTab[];
  roomId: string;
  visitorId: string | null;
}

/**
 * Product tab — filters overview sub-tabs to:
 * What is Linkrunner, Product Demo, Features, How It Works.
 * Uses a dropdown selector instead of horizontal tabs.
 */
export function TabProduct({ subTabs, roomId, visitorId }: TabProductProps) {
  const productSubTabs = subTabs.filter((t) =>
    (PRODUCT_SUB_TABS as readonly string[]).includes(t.sub_tab_key)
  );

  return (
    <SubTabDropdownSection
      subTabs={productSubTabs}
      roomId={roomId}
      visitorId={visitorId}
    />
  );
}
