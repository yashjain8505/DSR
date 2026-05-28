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
  brand_primary_color: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

/**
 * Meeting brief content for a room.
 */
export interface MeetingBrief {
  id: string;
  room_id: string;
  content: string;
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
 */
export interface Pricing {
  id: string;
  room_id: string;
  content: string;
  pricing_data: PricingTier[] | null;
  created_at: string;
  updated_at: string;
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
  brand_primary_color?: string | null;
  notes?: string;
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
