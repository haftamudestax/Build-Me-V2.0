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

const analyticsBaseUrl = import.meta.env.VITE_ANALYTICS_URL ?? null;

console.info("[Analytics] Startup configuration", {
  configured: Boolean(analyticsBaseUrl),
  baseUrl: analyticsBaseUrl,
});

const eventTypeByName: Record<string, AnalyticsEventType> = {
  "work_with_me.cta_clicked": "click",

  "delivery_project.selected": "click",
  "delivery_project.started": "feature_use",
  "delivery_project.validation_failed": "feature_use",
  "delivery_project.booking_submitted": "feature_use",
  "delivery_project.confirmation_viewed": "view",
  "delivery_project.submission_failed": "feature_use",

  "mentor_me.selected": "click",
  "mentor_me.started": "feature_use",
  "mentor_me.validation_failed": "feature_use",
  "mentor_me.booking_submitted": "feature_use",
  "mentor_me.confirmation_viewed": "view",
  "mentor_me.submission_failed": "feature_use",
};

interface CustomAnalyticsEventDetail {
  eventName?: string;
  metadata?: Record<string, unknown>;
  sourceRoute?: string;
  destinationRoute?: string;
  journey?: string;
}

function handleCustomAnalyticsEvent(event: Event): void {
  const detail = (event as CustomEvent<CustomAnalyticsEventDetail>).detail;

  if (!detail?.eventName) {
    return;
  }

  const eventName = detail.eventName;
  const eventType = eventTypeByName[eventName];

  // Ignore events that are not part of this listener's supported mapping.
  if (!eventType) {
    console.warn("Unrecognized custom analytics event:", eventName);
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
      : "work_with_me";

  void trackAnalyticsEvent({
    eventName: eventName as AnalyticsEventName,
    eventType,
    visitorId: config.visitorId,
    sessionId: config.sessionId,
    feature,
    journey:
      detail.journey ??
      (feature === "work_with_me" ? "delivery_project" : feature),
    sourceRoute: detail.sourceRoute ?? window.location.pathname,
    destinationRoute: detail.destinationRoute,
    metadata: detail.metadata ?? {},
  }).catch((error: unknown) => {
    console.error("Failed to send custom analytics event:", {
      eventName,
      error,
    });
  });
}

async function initializeApp(): Promise<void> {
  if (analyticsBaseUrl) {
    const baseUrl = analyticsBaseUrl.replace(/\/+$/, "");
    const visitorRegistrationUrl = `${baseUrl}/api/visitors`;

    console.info("[Analytics] Registering visitor", {
      url: visitorRegistrationUrl,
    });

    try {
      const response = await fetch(visitorRegistrationUrl, {
        method: "POST",
      });

      console.info("[Analytics] Visitor registration response", {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        throw new Error(
          `Visitor registration failed: ${response.status} ${response.statusText}`,
        );
      }

      const registration: {
        visitor_id: string;
        session_id: string;
      } = await response.json();

      if (!registration.visitor_id || !registration.session_id) {
        throw new Error(
          "Visitor registration response did not contain visitor_id and session_id.",
        );
      }

      const analyticsConfig = {
        baseUrl,
        visitorId: registration.visitor_id,
        sessionId: registration.session_id,
      };

      configureAnalytics(analyticsConfig);
      configureNavAnalytics(analyticsConfig);

      console.info("[Analytics] Visitor registration completed", {
        hasVisitorId: Boolean(registration.visitor_id),
        hasSessionId: Boolean(registration.session_id),
      });
    } catch (error: unknown) {
      console.error("[Analytics] Initialization failed", {
        url: visitorRegistrationUrl,
        error,
      });

      const analyticsConfig = {
        baseUrl,
        visitorId: null,
        sessionId: null,
      };

      configureAnalytics(analyticsConfig);
      configureNavAnalytics(analyticsConfig);
    }
  } else {
    console.warn(
      "[Analytics] VITE_ANALYTICS_URL is not configured. Analytics initialization was skipped.",
    );
  }

  // Register once before rendering the app.
  window.addEventListener("build-me:analytics", handleCustomAnalyticsEvent);

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

void initializeApp();
