/**
 * Sub-tab keys for the Linkrunner Overview tab.
 * These map to the `sub_tab_key` column in overview_sub_tabs.
 */
export const OVERVIEW_SUB_TAB_KEYS = [
  "what_is_linkrunner",
  "product_demo",
  "features",
  "how_it_works",
  "differentiators",
  "integrations",
  "customers_references",
  "security_compliance",
] as const;

export type OverviewSubTabKey = (typeof OVERVIEW_SUB_TAB_KEYS)[number];

/**
 * Display labels for each overview sub-tab.
 */
export const OVERVIEW_SUB_TAB_LABELS: Record<OverviewSubTabKey, string> = {
  what_is_linkrunner: "What is Linkrunner",
  product_demo: "Product Demo",
  features: "Features",
  how_it_works: "How It Works",
  differentiators: "What Makes Us Different",
  integrations: "Integrations",
  customers_references: "Our Customers & References",
  security_compliance: "Security & Compliance",
};

/**
 * Default sort order for overview sub-tabs.
 */
export const OVERVIEW_SUB_TAB_SORT_ORDER: Record<OverviewSubTabKey, number> = {
  what_is_linkrunner: 0,
  product_demo: 1,
  features: 2,
  how_it_works: 3,
  differentiators: 4,
  integrations: 5,
  customers_references: 6,
  security_compliance: 7,
};

/**
 * Sub-tab keys belonging to the "Product" main tab.
 */
export const PRODUCT_SUB_TABS: OverviewSubTabKey[] = [
  "what_is_linkrunner",
  "product_demo",
  "features",
  "how_it_works",
];

/**
 * Sub-tab keys belonging to the "Why Linkrunner" main tab.
 */
export const WHY_LINKRUNNER_SUB_TABS: OverviewSubTabKey[] = [
  "differentiators",
  "integrations",
  "customers_references",
  "security_compliance",
];

/**
 * Main tab keys for the room.
 */
export const MAIN_TAB_KEYS = [
  "meeting_brief",
  "product",
  "why_linkrunner",
  "pricing",
  "case_studies",
  "comparison",
  "getting_started",
] as const;

export type MainTabKey = (typeof MAIN_TAB_KEYS)[number];

/**
 * Display labels for main tabs.
 */
export const MAIN_TAB_LABELS: Record<MainTabKey, string> = {
  meeting_brief: "Recap",
  product: "Product",
  why_linkrunner: "Why Linkrunner",
  pricing: "Pricing",
  case_studies: "Case Studies",
  comparison: "How We Compare",
  getting_started: "Getting Started",
};

/**
 * Tabs that are always visible (not unlockable).
 */
export const ALWAYS_VISIBLE_TABS: MainTabKey[] = [
  "meeting_brief",
  "product",
  "why_linkrunner",
  "pricing",
];

/**
 * Tabs that can be toggled on/off by admin.
 * Maps tab key to the corresponding boolean column in the rooms table.
 */
export const UNLOCKABLE_TABS: Record<string, MainTabKey> = {
  tab_case_studies_visible: "case_studies",
  tab_comparison_visible: "comparison",
  tab_getting_started_visible: "getting_started",
};

/**
 * Analytics event types.
 */
export const EVENT_TYPES = {
  PAGE_VIEW: "page_view",
  TAB_CLICK: "tab_click",
  SUB_TAB_CLICK: "sub_tab_click",
  EMAIL_GATE_SUBMIT: "email_gate_submit",
  VIDEO_PLAY: "video_play",
  LINK_CLICK: "link_click",
  TIME_ON_TAB: "time_on_tab",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

/**
 * Default iframe URL for the security & compliance sub-tab.
 */
export const TRUST_PAGE_URL = "https://trust.linkrunner.io";
