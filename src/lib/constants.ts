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
  "integrations",
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
  integrations: "Integrations",
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
  integrations: 5,
  security_compliance: 6,
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
  "integrations",
  "security_compliance",
];

/**
 * Main tab keys for the room.
 */
export const MAIN_TAB_KEYS = [
  "meeting_brief",
  ...OVERVIEW_SUB_TAB_KEYS,
  "pricing",
  "customers_references",
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
  ...OVERVIEW_SUB_TAB_LABELS,
  pricing: "Pricing",
  customers_references: "Our Customers and Case Studies",
  case_studies: "Case Studies",
  comparison: "How We Compare",
  getting_started: "Getting Started",
};

/**
 * Tabs that are always visible (not unlockable).
 */
export const ALWAYS_VISIBLE_TABS: MainTabKey[] = [
  "meeting_brief",
  ...OVERVIEW_SUB_TAB_KEYS,
  "pricing",
];

/**
 * Tabs that can be toggled on/off by admin.
 * Maps tab key to the corresponding boolean column in the rooms table.
 */
export const UNLOCKABLE_TABS: Record<string, MainTabKey> = {
  tab_customers_references_visible: "customers_references",
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
  "integrations",
  "security_compliance",
];

/**
 * Sub-tabs that ARE customizable per room (currently none from overview,
 * but leaving infrastructure in place).
 */
export const ROOM_CUSTOMIZABLE_SUB_TABS: readonly OverviewSubTabKey[] =
  OVERVIEW_SUB_TAB_KEYS.filter(
    (k) => !(ASSET_MANAGED_SUB_TABS as readonly string[]).includes(k)
  );

/**
 * Default customer reference logos seeded into every new room.
 * Admin can toggle each on/off per room.
 */
export const DEFAULT_CUSTOMER_REFERENCES: { name: string; logo_url: string }[] = [
  { name: "CARS24", logo_url: "/logos/cars24.png" },
  { name: "FatakPay", logo_url: "/logos/fatakpay.png" },
  { name: "KreditPe", logo_url: "/logos/kreditpe.png" },
  { name: "Cash247", logo_url: "/logos/cash247.png" },
  { name: "Bounce Daily", logo_url: "/logos/bounce-daily.png" },
  { name: "Pronto", logo_url: "/logos/pronto.png" },
  { name: "Zypp Electric", logo_url: "/logos/zypp-electric.png" },
  { name: "Meatigo", logo_url: "/logos/meatigo.png" },
  { name: "Playo", logo_url: "/logos/playo.png" },
  { name: "Astro 247", logo_url: "/logos/astro247.png" },
  { name: "Matiks", logo_url: "/logos/matiks.png" },
  { name: "CashBook", logo_url: "/logos/cashbook.webp" },
  { name: "Jumbo Gaming", logo_url: "/logos/jumbo-gaming.webp" },
  { name: "abcoffee", logo_url: "/logos/abcoffee.png" },
  { name: "Urban Money", logo_url: "/logos/urban-money.png" },
  { name: "Sid's Farm", logo_url: "/logos/sids-farm.png" },
  { name: "Zavo", logo_url: "/logos/zavo.png" },
  { name: "1% Club", logo_url: "/logos/one-percent-club.png" },
];

/**
 * Default case studies seeded into every new room.
 * Sourced from linkrunner.io/customer-stories. Admin can toggle visibility.
 */
export const DEFAULT_CASE_STUDIES: {
  title: string;
  customer_name: string;
  customer_logo_url: string;
  banner_url: string;
  url: string;
  content: string;
}[] = [
  {
    title: "34% Google Ads CPI Reduction in 3 Months",
    customer_name: "Playo",
    customer_logo_url: "https://linkrunner.io/logos/customers/square/playo-square-logo.webp",
    banner_url: "https://linkrunner.io/customer-stories/playo-banner-v2.jpg",
    url: "https://linkrunner.io/customer-stories/how-playo-cut-their-google-ads-cpi-by-34-in-3-months-using-linkrunner",
    content: `**Industry:** Sports & Fitness\n**Timeline:** Dec 2025 - Mar 2026\n\n### Key Results\n- CPI reduced from Rs.20.30 to Rs.13.39 (34% drop)\n- Installs grew 2.8x (4,004 to 11,112)\n- GrabOn partner channel grew 9.5x\n\n> "The customization Linkrunner provided surpassed competitors. Their team understood our needs and delivered a tailored solution." - Ronald M Thomas, Digital Marketing`,
  },
  {
    title: "46% Meta CPI Reduction in 3 Months",
    customer_name: "Matiks",
    customer_logo_url: "https://linkrunner.io/logos/customers/square/matiks-logo.webp",
    banner_url: "https://linkrunner.io/customer-stories/matiks-banner-v2.jpg",
    url: "https://linkrunner.io/customer-stories/how-matiks-cut-their-meta-cpi-by-46-in-just-3-months-using-linkrunner",
    content: `**Industry:** EdTech\n**Timeline:** Jan 2026 - Mar 2026\n\n### Key Results\n- Meta CPI dropped from Rs.22.34 to Rs.12.14 (46% reduction)\n- Installs grew 65% (65,045 to 107,625)\n- Monthly spend decreased 10%\n\n> "We switched to Linkrunner from our previous MMP and immediately saw the difference." - Hanika Saluja, Growth`,
  },
  {
    title: "100% Offline-to-App Attribution via QR Codes",
    customer_name: "abcoffee",
    customer_logo_url: "https://linkrunner.io/logos/customers/square/abcoffee-square-logo.png",
    banner_url: "https://linkrunner.io/customer-stories/abcoffee-banner-v3.jpg",
    url: "https://linkrunner.io/customer-stories/how-abcoffee-tracks-every-offline-user-from-a-qr-to-the-app-with-linkrunner",
    content: `**Industry:** F&B / Retail\n\n### Key Results\n- 100% attribution coverage (zero installs in "unknown" bucket)\n- 85% of installs from packaging and delivery bags\n- 46,000+ QR scans attributed, 14,000+ installs`,
  },
  {
    title: "$1M+ Revenue Tracked Across 200 Campaigns",
    customer_name: "Jumbo Gaming",
    customer_logo_url: "https://linkrunner.io/logos/customers/square/jumbo-gaming-square-logo.webp",
    banner_url: "https://linkrunner.io/customer-stories/jumbo-banner-v2.jpg",
    url: "https://linkrunner.io/customer-stories/how-jumbo-tracked-1m-in-revenue-from-200-campaigns-with-linkrunner",
    content: `**Industry:** Gaming\n\n### Key Results\n- $1.5M revenue tracked across 30K+ transactions\n- 18% uplift in click-to-install conversion\n- 30-40% ROAS improvement vs. industry averages\n\n> "Implementing Linkrunner was seamless. Their analytics significantly improved our user acquisition strategy." - Ekansh Aggarwal, Product & Growth`,
  },
  {
    title: "35% ROAS Improvement in 3 Months",
    customer_name: "Stratzy",
    customer_logo_url: "https://linkrunner.io/logos/customers/square/stratzy-square-logo-small.webp",
    banner_url: "https://linkrunner.io/customer-stories/stratzy-banner-v2.jpg",
    url: "https://linkrunner.io/customer-stories/how-stratzy-identified-higher-roas-campaigns-using-linkrunner",
    content: `**Industry:** Fintech\n\n### Key Results\n- 1.23M links migrated from Firebase Dynamic Links\n- 35% ROAS improvement by end of month 3\n- Repeat deposits doubled on paid campaigns\n\n> "Linkrunner has helped us quickly understand which campaigns deliver higher ROAS." - Gaurav Sangle, Co-Founder & CTO`,
  },
  {
    title: "6x Higher Web-to-Mobile Conversion",
    customer_name: "August AI",
    customer_logo_url: "https://linkrunner.io/logos/customers/square/augustai-square-logo.webp",
    banner_url: "https://linkrunner.io/customer-stories/august-ai-banner-v2.jpg",
    url: "https://linkrunner.io/customer-stories/how-august-ai-turns-web-visitors-into-mobile-patients-at-6x-higher-conversion",
    content: `**Industry:** Healthcare AI\n**Timeline:** Aug 2025 - May 2026\n\n### Key Results\n- 60% web-to-app install conversion (industry norm: 5-15%)\n- 145,000+ patient installs tracked\n- iOS installs grew 5.6x`,
  },
  {
    title: "46% Meta CPA Reduction in 6 Weeks",
    customer_name: "CashBook",
    customer_logo_url: "https://linkrunner.io/logos/customers/square/cashbook-square-logo.webp",
    banner_url: "https://linkrunner.io/customer-stories/cashbook-banner-v2.jpg",
    url: "https://linkrunner.io/customer-stories/how-cashbook-cut-their-meta-cpa-by-46-in-6-weeks-using-linkrunner",
    content: `**Industry:** SMB Fintech\n**Timeline:** Mar 2026 - Apr 2026\n\n### Key Results\n- Meta CPA dropped 46% (Rs.43.25 to Rs.23.42) in 30 days\n- Install-to-activation rate lifted 14 points\n- 29,000+ activated users in 2 months`,
  },
];

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
