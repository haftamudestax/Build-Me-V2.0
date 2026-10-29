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
