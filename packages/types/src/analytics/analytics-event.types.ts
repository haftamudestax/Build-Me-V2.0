export type AnalyticsEventType =
  | "page_view"
  | "hero_view"
  | "click"
  | "view"
  | "feature_use";

export type AnalyticsEventName =
  | "hero.viewed"
  | "page.viewed"
  | "navbar.logo_click"
  | "navbar.nav_link_click"
  | "navbar.logo_view"
  | "work_with_me.cta_clicked"
  | "delivery_project.selected"
  | "delivery_project.started"
  | "delivery_project.validation_failed"
  | "delivery_project.booking_submitted"
  | "delivery_project.confirmation_viewed"
  | "delivery_project.submission_failed"
  | "mentor_me.selected"
  | "mentor_me.started"
  | "mentor_me.validation_failed"
  | "mentor_me.booking_submitted"
  | "mentor_me.confirmation_viewed"
  | "mentor_me.submission_failed";

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
