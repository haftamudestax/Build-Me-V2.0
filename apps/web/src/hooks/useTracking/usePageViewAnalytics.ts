
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackAnalyticsEvent } from "@build-me/utils";

interface UsePageViewAnalyticsOptions {
  visitorId: string | null;
  sessionId?: string | null;
  enabled?: boolean;
}

export function usePageViewAnalytics({
  visitorId,
  sessionId,
  enabled = true,
}: UsePageViewAnalyticsOptions): void {
  const location = useLocation();

  useEffect(() => {
    if (!enabled || !visitorId) return;

    void trackAnalyticsEvent({
      visitorId: visitorId,
      sessionId: sessionId,
      eventName: "page.viewed",
      eventType: "view",
      sourceRoute: location.pathname,
      timestamp: new Date().toISOString(),
      metadata: {
        component: "page",
      },
    });
  }, [
    location.pathname,
    location.search,
    visitorId,
    sessionId,
    enabled,
  ]);
}
