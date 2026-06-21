import type { MainTabKey, OverviewSubTabKey } from "@/lib/constants";

/**
 * Room record from the rooms table.
 */
export interface Room {
  id: string;
  slug: string;
  company_name: string;
  logo_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  is_active: boolean;
  tab_case_studies_visible: boolean;
  tab_comparison_visible: boolean;
  tab_getting_started_visible: boolean;
  tab_customers_references_visible: boolean;
  comparison_competitors: string[];
  brand_primary_color: string | null;
  /** Accent color shown alongside the primary (migration 008). */
  brand_secondary_color?: string | null;
  notes: string;
  /** Optional until migration 007 has been applied. */
  restrict_access?: boolean;
  /** Page keys hidden in this room (migration 011). Optional until applied. */
  hidden_sections?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Allowlist entry for a restricted room (room_access table).
 */
export interface RoomAccessEntry {
  id: string;
  room_id: string;
  email: string;
  created_at: string;
}

/**
 * Meeting brief content for a room.
 */
export interface MeetingBrief {
  id: string;
  room_id: string;
  content: string;
  next_steps: string;
  created_at: string;
  updated_at: string;
}

/**
 * A single overview sub-tab entry.
 */
export interface OverviewSubTab {
  id: string;
  room_id: string;
  sub_tab_key: OverviewSubTabKey;
  title: string;
  content: string;
  youtube_url: string | null;
  iframe_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Pricing content for a room.
 *
 * `pricing_data` is a jsonb column. Legacy rows may store a bare
 * `PricingTier[]`; new rows store the richer `PricingData` object.
 * Use `normalizePricingData()` to handle both shapes.
 */
export interface Pricing {
  id: string;
  room_id: string;
  content: string;
  pricing_data: PricingData | PricingTier[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Personalized pricing quote shown at the top of the pricing tab.
 * All fields are set per-customer by the admin.
 */
export interface PricingQuote {
  estimated_volume: number;
  per_install_price: number;
  currency: string;
  free_threshold: number;
  value_props: string[];
}

/**
 * A volume bracket — "at X installs/mo, the per-install price is Y".
 */
export interface VolumeTier {
  volume: number;
  per_install_price: number;
}

/**
 * A volume range — "from min to max installs/mo, the per-install price is Y".
 * Drives the interactive pricing slider on the room pricing tab.
 */
export interface RangeTier {
  min_volume: number;
  max_volume: number;
  per_install_price: number;
}

/**
 * A competitor's pricing for side-by-side comparison.
 */
export interface CompetitorPricing {
  name: string;
  per_install_price: number;
  pricing_model: string;
  notes?: string;
}

/**
 * Full pricing configuration stored in pricing_data jsonb.
 */
export interface PricingData {
  quote?: PricingQuote;
  /** Volume ranges driving the interactive pricing slider. */
  range_tiers?: RangeTier[];
  /** Legacy point-based volume brackets (converted to ranges at render). */
  volume_tiers?: VolumeTier[];
  /** Competitor pricing for comparison section. */
  competitor_pricing?: CompetitorPricing[];
  /** Legacy plan-based tiers (Free/Growth/Enterprise). Kept for compat. */
  tiers?: PricingTier[];
}

/**
 * Structured pricing tier (stored in pricing_data jsonb).
 */
export interface PricingTier {
  name: string;
  price: string;
  billing_period: string;
  description: string;
  features: string[];
  is_highlighted: boolean;
  cta_label: string;
  cta_url: string;
  /** "Preferred for" bullet list shown below the CTA. */
  preferred_for?: string[];
  /** Optional secondary CTA (e.g. "Calculate pricing"). */
  secondary_cta_label?: string;
  secondary_cta_url?: string;
}

/**
 * Normalize pricing_data from DB. Legacy rows store a bare PricingTier[];
 * new rows store a PricingData object with { quote?, volume_tiers?, tiers? }.
 */
export function normalizePricingData(
  raw: PricingData | PricingTier[] | null,
): PricingData {
  if (!raw) return {};
  if (Array.isArray(raw)) return { tiers: raw };
  return raw;
}

/**
 * Customer reference logo entry (per-room, admin-managed).
 */
export interface CustomerReference {
  id: string;
  room_id: string;
  name: string;
  logo_url: string;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Case study entry.
 */
export interface CaseStudy {
  id: string;
  room_id: string;
  title: string;
  customer_name: string;
  customer_logo_url: string | null;
  banner_url: string | null;
  url: string | null;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Competitor comparison entry.
 */
export interface Comparison {
  id: string;
  room_id: string;
  competitor_name: string;
  competitor_logo_url: string | null;
  content: string;
  comparison_data: ComparisonFeature[] | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Structured comparison feature row (stored in comparison_data jsonb).
 */
export interface ComparisonFeature {
  feature: string;
  linkrunner: string;
  competitor: string;
}

/**
 * Getting started content for a room.
 */
export interface GettingStarted {
  id: string;
  room_id: string;
  integration_timeline: string;
  migration_steps: string;
  onboarding_plan: string;
  created_at: string;
  updated_at: string;
}

/**
 * Visitor record from email gate.
 */
export interface Visitor {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  created_at: string;
}

/**
 * Room visit record.
 */
export interface RoomVisit {
  id: string;
  room_id: string;
  visitor_id: string;
  first_visited_at: string;
  last_visited_at: string;
}

/**
 * Analytics event record.
 */
export interface AnalyticsEvent {
  id: string;
  room_id: string;
  visitor_id: string | null;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Full room data including all tab content (used by prospect-facing page).
 */
export interface RoomWithContent {
  room: Room;
  meeting_brief: MeetingBrief;
  overview_sub_tabs: OverviewSubTab[];
  pricing: Pricing;
  case_studies: CaseStudy[];
  comparisons: Comparison[];
  getting_started: GettingStarted;
  customer_references: CustomerReference[];
  assets: Asset[];
}

/**
 * Visible tabs for a room (computed from room flags).
 */
export interface VisibleTabs {
  tabs: MainTabKey[];
}

/**
 * Analytics summary for admin dashboard.
 */
export interface RoomAnalyticsSummary {
  total_views: number;
  unique_visitors: number;
  tab_clicks: Record<string, number>;
  recent_visitors: VisitorActivity[];
}

/**
 * Visitor activity entry for analytics.
 */
export interface VisitorActivity {
  visitor: Visitor;
  last_visited_at: string;
  total_events: number;
}

/**
 * A single analytics event in a visitor's activity timeline.
 */
export interface VisitorEventEntry {
  id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Cross-room analytics response (admin dashboard).
 */
export interface CrossRoomAnalytics {
  kpis: {
    total_page_views: number;
    total_unique_visitors: number;
    active_rooms: number;
    email_conversion_rate: number;
  };
  rooms: RoomAnalyticsCard[];
  daily_activity: DailyActivity[];
  recent_visitors: CrossRoomVisitorEntry[];
}

export interface RoomAnalyticsCard {
  id: string;
  slug: string;
  company_name: string;
  logo_url: string | null;
  page_views: number;
  tab_clicks: number;
  email_submits: number;
  video_plays: number;
  unique_visitors: number;
  sparkline: number[];
  sparkline_dates: string[];
  last_activity: string | null;
}

export interface DailyActivity {
  date: string;
  page_view: number;
  tab_click: number;
  email_gate_submit: number;
  video_play: number;
  link_click: number;
}

export interface CrossRoomVisitorEntry {
  email: string;
  name: string | null;
  company: string | null;
  rooms_visited: { room_id: string; company_name: string }[];
  total_events: number;
  last_active: string;
}

/**
 * Room list item for admin dashboard (room + basic stats).
 */
export interface RoomListItem extends Room {
  total_views: number;
  unique_visitors: number;
}

/**
 * Payload for creating a new room.
 */
export interface CreateRoomPayload {
  slug: string;
  company_name: string;
  logo_url?: string;
  contact_name?: string;
  contact_email?: string;
}

/**
 * Payload for updating room settings.
 */
export interface UpdateRoomPayload {
  slug?: string;
  company_name?: string;
  logo_url?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  is_active?: boolean;
  tab_case_studies_visible?: boolean;
  tab_comparison_visible?: boolean;
  tab_getting_started_visible?: boolean;
  tab_customers_references_visible?: boolean;
  comparison_competitors?: string[];
  brand_primary_color?: string | null;
  brand_secondary_color?: string | null;
  notes?: string;
  restrict_access?: boolean;
  hidden_sections?: string[];
}

/**
 * Payload for the email gate submission.
 */
export interface EmailGatePayload {
  email: string;
  name?: string;
  company?: string;
  room_id: string;
}

/**
 * Global asset record (template content shared across all rooms).
 */
export interface Asset {
  id: string;
  category: string;
  title: string;
  asset_type: "markdown" | "youtube_url" | "iframe_url" | "file_url";
  content: string;
  url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Payload for creating/updating an asset.
 */
export interface SaveAssetPayload {
  category: string;
  title: string;
  asset_type: "markdown" | "youtube_url" | "iframe_url" | "file_url";
  content: string;
  url?: string | null;
  sort_order?: number;
}

/**
 * Payload for tracking an analytics event.
 */
export interface TrackEventPayload {
  room_id: string;
  visitor_id?: string;
  event_type: string;
  event_data?: Record<string, unknown>;
}

/**
 * Granola meeting participant.
 */
export interface GranolaMeetingParticipant {
  name: string;
  email: string;
  company?: string;
  is_creator?: boolean;
}

/**
 * Cached Granola meeting record from granola_meeting_cache table.
 */
export interface GranolaMeetingCache {
  id: string;
  granola_meeting_id: string;
  title: string;
  meeting_date: string;
  participants: GranolaMeetingParticipant[];
  summary: string;
  meeting_brief: string;
  company_name: string | null;
  contact_email: string | null;
  synced_at: string;
}

/**
 * Payload for syncing Granola meetings into the cache.
 */
export interface SyncGranolaMeetingPayload {
  granola_meeting_id: string;
  title: string;
  meeting_date: string;
  participants: GranolaMeetingParticipant[];
  summary: string;
  company_name?: string;
  contact_email?: string;
}

// ---------------------------------------------------------------------------
// Ideation engine
// ---------------------------------------------------------------------------

/** A play from the `plays` table (seeded from config, or promoted wild cards). */
export interface Play {
  id: number;
  name: string;
  description: string;
  triggers: string;
  asset_hint: string | null;
  cost_tier: number;
  min_deal_size: number;
  origin: string; // seed | promoted
  active: boolean;
  created_at: string;
}

/**
 * The ideation engine's base layer, moved from config/ files into the DB so it
 * can be edited from the admin dashboard (engine_config table, migration 010).
 */
export type EngineConfigKey =
  | "company_context"
  | "data_assets"
  | "knowledge_base";

export interface EngineConfig {
  key: EngineConfigKey;
  value: string;
  updated_at: string;
}
