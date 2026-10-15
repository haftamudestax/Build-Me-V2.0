export type NavEventName =
  | "navbar.logo_click"
  | "navbar.nav_link_click"
  | "navbar.logo_view";

export type NavEventType = "click" | "view";

export type NavDeviceType = "desktop" | "tablet" | "mobile";

export interface NavigationEventPayload {
  visitor_id: string;
  session_id?: string;
  event_name: NavEventName;
  event_type: NavEventType;
  source_route: string;
  destination_route: string;
  navigation_success?: boolean | null;
  device_type: NavDeviceType;
  viewport_type: string;
}

interface NavAnalyticsConfig {
  baseUrl: string | null;
  visitorId: string | null;
  sessionId: string | null;
}

let config: NavAnalyticsConfig = {
  baseUrl: null,
  visitorId: null,
  sessionId: null,
};

export function configureNavAnalytics(
  next: Partial<NavAnalyticsConfig>,
): void {
  config = { ...config, ...next };
}

function getDeviceType(): NavDeviceType {
  const width = window.innerWidth;

  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";

  return "desktop";
}

/**
 * Removes trailing slash characters without using a regular expression.
 */
function normalizeBaseUrl(baseUrl: string): string {
  let normalizedUrl = baseUrl;

  while (normalizedUrl.endsWith("/")) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }

  return normalizedUrl;
}

export function trackNavigationEvent(params: {
  sourceRoute: string;
  destinationRoute: string;
  eventName: NavEventName;
  eventType: NavEventType;
  navigationSuccess?: boolean | null;
}): void {
  const { baseUrl, visitorId, sessionId } = config;

  if (!baseUrl || !visitorId) return;

  const deviceType = getDeviceType();

  const payload: NavigationEventPayload = {
    visitor_id: visitorId,
    ...(sessionId ? { session_id: sessionId } : {}),
    event_name: params.eventName,
    event_type: params.eventType,
    source_route: params.sourceRoute,
    destination_route: params.destinationRoute,
    device_type: deviceType,
    viewport_type: deviceType,
    ...(params.navigationSuccess !== undefined
      ? { navigation_success: params.navigationSuccess }
      : {}),
  };

  const endpoint = `${normalizeBaseUrl(baseUrl)}/events`;

  void fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Analytics failures must not break the user's navigation.
  });
}
