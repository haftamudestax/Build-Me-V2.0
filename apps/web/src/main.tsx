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

console.info("[Analytics] Startup configuration", {
  configured: Boolean(analyticsBaseUrl.trim()),
  baseUrl: analyticsBaseUrl.trim() || null,
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
  "ownership_audit.selected": "click",
  "ownership_audit.started": "feature_use",
  "ownership_audit.answer_selected": "click",
  "ownership_audit.step_completed": "feature_use",
  "ownership_audit.validation_failed": "feature_use",
  "ownership_audit.completed": "feature_use",
  "ownership_audit.results_viewed": "view",
  "ownership_audit.restarted": "click",
  "ownership_audit.back_to_paths": "click",
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

function handleCustomAnalyticsEvent(event: Event): void {
  const detail = (event as CustomEvent<CustomAnalyticsEventDetail>).detail;

  if (!detail?.eventName) {
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
    sourceRoute: detail.sourceRoute ?? window.location.pathname,
    destinationRoute: detail.destinationRoute,
    metadata: detail.metadata ?? {},
  }).catch((error: unknown) => {
    console.error("[Analytics] Failed to send custom event.", {
      eventName,
      error,
    });
  });
}

function configureUnavailableAnalytics(baseUrl: string): void {
  const analyticsConfig = {
    baseUrl,
    visitorId: null,
    sessionId: null,
  };

  configureAnalytics(analyticsConfig);
  configureNavAnalytics(analyticsConfig);
}

async function registerVisitor(baseUrl: string): Promise<void> {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const visitorRegistrationUrl = `${normalizedBaseUrl}/api/visitors`;

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

    const analyticsConfig = {
      baseUrl: normalizedBaseUrl,
      visitorId: registration.visitor_id,
      sessionId: registration.session_id,
    };

    configureAnalytics(analyticsConfig);
    configureNavAnalytics(analyticsConfig);

    console.info("[Analytics] Visitor registration completed", {
      hasVisitorId: true,
      hasSessionId: true,
    });
  } catch (error: unknown) {
    console.error("[Analytics] Visitor registration failed.", {
      url: visitorRegistrationUrl,
      error,
    });

    configureUnavailableAnalytics(normalizedBaseUrl);
  }
}

async function initializeApp(): Promise<void> {
  const normalizedAnalyticsBaseUrl = analyticsBaseUrl.trim()
    ? analyticsBaseUrl.trim().replace(/\/+$/, "")
    : "";

  if (normalizedAnalyticsBaseUrl) {
    await registerVisitor(normalizedAnalyticsBaseUrl);
  } else {
    console.warn(
      "[Analytics] VITE_ANALYTICS_URL is missing or empty. Analytics registration was skipped.",
    );

    configureUnavailableAnalytics("");
  }

  // Register the listener before rendering so initial component events
  // are not missed.
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

void initializeApp().catch((error: unknown) => {
  console.error("[App] Application initialization failed.", error);

  const rootElement = document.getElementById("root");

  if (!rootElement) {
    return;
  }

  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});
