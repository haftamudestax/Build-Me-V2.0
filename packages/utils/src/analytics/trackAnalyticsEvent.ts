import type { TrackAnalyticsEventOptions } from "@build-me/types";
import { getAnalyticsConfig } from "./analyticsClient";

export async function trackAnalyticsEvent(
  options: TrackAnalyticsEventOptions,
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const config = getAnalyticsConfig();

  // Analytics is optional; do not send events before initialization.
  if (!config?.baseUrl || !config.visitorId) {
    return;
  }

  const payload = {
    ...options,
    visitorId: options.visitorId ?? config.visitorId,
    sessionId: options.sessionId ?? config.sessionId,
    timestamp: options.timestamp ?? new Date().toISOString(),
    metadata: options.metadata ?? {},
  };

  // Remove trailing slashes without using a regular expression.
  let baseUrl = config.baseUrl;

  while (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  const response = await fetch(`${baseUrl}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to track analytics event: ${response.status}`,
    );
  }
}
