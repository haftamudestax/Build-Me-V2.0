import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { configureNavAnalytics } from "@build-me/ui/navbar";
import {
  configureAnalytics,
  getAnalyticsConfig,
  trackAnalyticsEvent,
} from "@build-me/utils";
import type { AnalyticsEventName, AnalyticsEventType } from "@build-me/types";

import { router } from "./routes/Routes.tsx";
import "./index.css";

const analyticsBaseUrl = import.meta.env.VITE_ANALYTICS_URL ?? "";

const normalizedAnalyticsBaseUrl = analyticsBaseUrl.trim()
  ? analyticsBaseUrl.trim().replace(/\/+$/, "")
  : "";

console.info("[Analytics] Startup configuration", {
  configured: Boolean(normalizedAnalyticsBaseUrl),
  baseUrl: normalizedAnalyticsBaseUrl || null,
});

const eventTypeByName: Record<string, AnalyticsEventType> = {
  // Work With Me
  "work_with_me.cta_clicked": "click",
  "work_with_me.opened": "click",
  "work_with_me.closed": "click",
  "work_with_me.reference_copied": "click",

  // Delivery Project
  "delivery_project.selected": "click",
  "delivery_project.started": "feature_use",
  "delivery_project.validation_failed": "feature_use",
  "delivery_project.booking_submitted": "feature_use",
  "delivery_project.confirmation_viewed": "view",
  "delivery_project.submission_failed": "feature_use",
  "delivery_project.back_to_paths": "click",

  // Mentor Me
  "mentor_me.selected": "click",
  "mentor_me.started": "feature_use",
  "mentor_me.validation_failed": "feature_use",
  "mentor_me.booking_submitted": "feature_use",
  "mentor_me.confirmation_viewed": "view",
  "mentor_me.submission_failed": "feature_use",
  "mentor_me.back_to_paths": "click",

  // Coffee With Me
  "coffee_with_me.selected": "click",
  "coffee_with_me.started": "feature_use",
  "coffee_with_me.validation_failed": "feature_use",
  "coffee_with_me.booking_submitted": "feature_use",
  "coffee_with_me.confirmation_viewed": "view",
  "coffee_with_me.submission_failed": "feature_use",
  "coffee_with_me.back_to_paths": "click",

  // Ownership Audit
  // These types must match EXPECTED_EVENT_TYPES in:
  // services/analytics/src/processing/ownership_audit.py
  "ownership_audit.selected": "click",
  "ownership_audit.started": "feature_use",
  "ownership_audit.answer_selected": "click",
  "ownership_audit.step_completed": "feature_use",
  "ownership_audit.validation_failed": "feature_use",
  "ownership_audit.registration_completed": "feature_use",
  "ownership_audit.completed": "feature_use",
  "ownership_audit.results_viewed": "view",
  "ownership_audit.next_steps_viewed": "view",
  "ownership_audit.path_selected": "click",
  "ownership_audit.restarted": "click",
  "ownership_audit.back_to_paths": "click",

  // Get Quick Wins
  "get_quick_wins.opened": "click",
  "get_quick_wins.closed": "click",
};

interface CustomAnalyticsEventDetail {
  eventName?: string;
  metadata?: Record<string, unknown>;
  sourceRoute?: string;
  destinationRoute?: string;
  journey?: string;
}

interface VisitorRegistration {
  visitor_id: string;
  session_id: string;
}

interface PendingAnalyticsEvent {
  detail: CustomAnalyticsEventDetail;
  sourceRoute: string;
}

const pendingAnalyticsEvents: PendingAnalyticsEvent[] = [];

let visitorRegistrationCompleted = false;

function configureUnavailableAnalytics(baseUrl: string): void {
  const analyticsConfig = {
    baseUrl,
    visitorId: null,
    sessionId: null,
  };

  configureAnalytics(analyticsConfig);
  configureNavAnalytics(analyticsConfig);
}

function sendCustomAnalyticsEvent(
  detail: CustomAnalyticsEventDetail,
  sourceRoute: string,
): void {
  if (!detail.eventName) {
    return;
  }

  const eventName = detail.eventName;
  const eventType = eventTypeByName[eventName];

  if (!eventType) {
    console.warn("[Analytics] Unrecognized custom analytics event:", eventName);
    return;
  }

  const config = getAnalyticsConfig();

  if (!config?.baseUrl || !config.visitorId) {
    console.warn("[Analytics] Event skipped: visitor session is unavailable.", {
      eventName,
      configured: Boolean(config?.baseUrl),
      hasVisitorId: Boolean(config?.visitorId),
    });
    return;
  }

  const feature = eventName.startsWith("mentor_me.")
    ? "mentor_me"
    : eventName.startsWith("delivery_project.")
      ? "delivery_project"
      : eventName.startsWith("coffee_with_me.")
        ? "coffee_with_me"
        : eventName.startsWith("ownership_audit.")
          ? "ownership_audit"
          : eventName.startsWith("get_quick_wins.")
            ? "get_quick_wins"
            : "work_with_me";

  const journey =
    detail.journey ??
    (feature === "work_with_me" ? "delivery_project" : feature);

  void trackAnalyticsEvent({
    eventName: eventName as AnalyticsEventName,
    eventType,
    visitorId: config.visitorId,
    sessionId: config.sessionId,
    feature,
    journey,
    sourceRoute,
    destinationRoute: detail.destinationRoute,
    metadata: detail.metadata ?? {},
  }).catch((error: unknown) => {
    console.error("[Analytics] Failed to send custom event.", {
      eventName,
      error,
    });
  });
}

function handleCustomAnalyticsEvent(event: Event): void {
  const detail = (event as CustomEvent<CustomAnalyticsEventDetail>).detail;

  if (!detail?.eventName) {
    return;
  }

  const sourceRoute = detail.sourceRoute ?? window.location.pathname;

  if (!visitorRegistrationCompleted) {
    if (!normalizedAnalyticsBaseUrl) {
      console.warn("[Analytics] Event skipped: analytics URL is unavailable.", {
        eventName: detail.eventName,
      });
      return;
    }

    pendingAnalyticsEvents.push({
      detail,
      sourceRoute,
    });

    return;
  }

  sendCustomAnalyticsEvent(detail, sourceRoute);
}

function flushPendingAnalyticsEvents(): void {
  const queuedEvents = pendingAnalyticsEvents.splice(
    0,
    pendingAnalyticsEvents.length,
  );

  for (const queuedEvent of queuedEvents) {
    sendCustomAnalyticsEvent(queuedEvent.detail, queuedEvent.sourceRoute);
  }
}

async function registerVisitor(baseUrl: string): Promise<void> {
  const visitorRegistrationUrl = `${baseUrl}/api/visitors`;

  console.info("[Analytics] Registering visitor", {
    url: visitorRegistrationUrl,
  });

  try {
    const response = await fetch(visitorRegistrationUrl, {
      method: "POST",
    });

    console.info("[Analytics] Visitor registration response", {
      url: visitorRegistrationUrl,
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      throw new Error(
        `Visitor registration failed: ${response.status} ${response.statusText}`,
      );
    }

    const registration: VisitorRegistration = await response.json();

    if (
      typeof registration.visitor_id !== "string" ||
      !registration.visitor_id.trim() ||
      typeof registration.session_id !== "string" ||
      !registration.session_id.trim()
    ) {
      throw new Error(
        "Visitor registration response must contain non-empty visitor_id and session_id strings.",
      );
    }

    configureAnalytics({
      baseUrl,
      visitorId: registration.visitor_id,
      sessionId: registration.session_id,
    });

    configureNavAnalytics({
      baseUrl,
      visitorId: registration.visitor_id,
      sessionId: registration.session_id,
    });

    visitorRegistrationCompleted = true;

    console.info("[Analytics] Visitor registration completed", {
      hasVisitorId: true,
      hasSessionId: true,
    });

    flushPendingAnalyticsEvents();
  } catch (error: unknown) {
    console.error("[Analytics] Visitor registration failed.", {
      url: visitorRegistrationUrl,
      error,
    });

    configureUnavailableAnalytics(baseUrl);

    // Registration failed: queued events cannot be sent without
    // a valid visitor session.
    pendingAnalyticsEvents.length = 0;
    visitorRegistrationCompleted = true;
  }
}

function renderApp(): void {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error('Root element "#root" was not found.');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

function initializeApp(): void {
  // Register the listener before rendering so initial component
  // events can be queued while visitor registration is in progress.
  window.addEventListener("build-me:analytics", handleCustomAnalyticsEvent);

  if (!normalizedAnalyticsBaseUrl) {
    console.warn(
      "[Analytics] VITE_ANALYTICS_URL is missing or empty. Analytics registration was skipped.",
    );

    configureUnavailableAnalytics("");
    visitorRegistrationCompleted = true;
  }

  // Render independently of analytics initialization.
  renderApp();

  if (normalizedAnalyticsBaseUrl) {
    void registerVisitor(normalizedAnalyticsBaseUrl);
  }
}

try {
  initializeApp();
} catch (error: unknown) {
  console.error("[App] Application initialization failed.", error);
}
