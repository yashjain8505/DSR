/**
 * Sub-tab keys for the Linkrunner Overview tab.
 * These map to the `sub_tab_key` column in overview_sub_tabs.
 */
export const OVERVIEW_SUB_TAB_KEYS = [
  "what_is_linkrunner",
  "product_demo",
  "features",
  "how_it_works",
  "company_deck",
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
  company_deck: "Company Deck",
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
  company_deck: 4,
  differentiators: 5,
  integrations: 6,
  customers_references: 7,
  security_compliance: 8,
};

/**
 * Sub-tab keys belonging to the "Product" main tab.
 */
export const PRODUCT_SUB_TABS: OverviewSubTabKey[] = [
  "what_is_linkrunner",
  "product_demo",
  "features",
  "how_it_works",
  "company_deck",
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
 * Sub-tabs managed globally via Assets — not editable per-room.
 * These are hidden from the room overview editor.
 */
export const ASSET_MANAGED_SUB_TABS: readonly OverviewSubTabKey[] = [
  "what_is_linkrunner",
  "product_demo",
  "features",
  "how_it_works",
  "company_deck",
  "differentiators",
  "integrations",
  "security_compliance",
];

/**
 * Sub-tabs that ARE customizable per room (currently none from overview,
 * but leaving infrastructure in place).
 */
export const ROOM_CUSTOMIZABLE_SUB_TABS: readonly OverviewSubTabKey[] =
  OVERVIEW_SUB_TAB_KEYS.filter(
    (k) =>
      !(ASSET_MANAGED_SUB_TABS as readonly string[]).includes(k) &&
      k !== "customers_references" // hard-coded in code
  );

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

/**
 * Asset categories for the global Assets tab.
 * These map to the room content sections that are the same for every customer.
 */
export const ASSET_CATEGORIES = [
  "what_is_linkrunner",
  "product_demo",
  "features",
  "how_it_works",
  "company_deck",
  "differentiators",
  "integrations",
  "security_compliance",
  "case_studies",
  "comparisons",
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  what_is_linkrunner: "What is Linkrunner",
  product_demo: "Product Demo",
  features: "Features",
  how_it_works: "How It Works",
  company_deck: "Company Deck",
  differentiators: "Differentiators",
  integrations: "Integrations",
  security_compliance: "Security & Compliance",
  case_studies: "Case Studies",
  comparisons: "Comparisons",
};

export const ASSET_TYPE_OPTIONS = [
  { value: "markdown", label: "Markdown" },
  { value: "youtube_url", label: "YouTube URL" },
  { value: "iframe_url", label: "Embed URL" },
  { value: "file_url", label: "File URL" },
] as const;
