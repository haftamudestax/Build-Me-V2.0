
export type AnalyticsEventType =
  | "page_view"
  | "hero_view"
  | "click"
  |"view"
  | "feature_use";

export type AnalyticsEventName =
  | "hero.viewed"
  | "page.viewed"
  | "navbar.logo_click"
  | "navbar.nav_link_click"
  | "navbar.logo_view";

export interface AnalyticsEventPayload {
  visitorId?: string;
  sessionId?: string | null;
  eventName: AnalyticsEventName;
  eventType: AnalyticsEventType;
  feature?: string | null;
  sourceRoute?: string;
  destinationRoute?: string;
  journey?: string | null;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface TrackAnalyticsEventOptions
  extends AnalyticsEventPayload {}
