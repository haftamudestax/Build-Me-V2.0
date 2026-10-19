import { useEffect, useRef } from "react";
import type { AnalyticsEventName } from "@build-me/types";
import { trackAnalyticsEvent } from "@build-me/utils";

interface UseVisibilityAnalyticsOptions {
  eventName: Extract<
    AnalyticsEventName,
    "hero.viewed" | "page.viewed"
  >;
  enabled?: boolean;
}

export function useVisibilityAnalytics(
  target: Element | null,
  {
    eventName,
    enabled = true,
  }: UseVisibilityAnalyticsOptions,
): void {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!enabled || !target || hasTracked.current) {
      return;
    }

    const track = () => {
      if (hasTracked.current) {
        return;
      }

      hasTracked.current = true;

      void trackAnalyticsEvent({
        eventName,
        eventType: "view",
        sourceRoute: window.location.pathname,
        timestamp: new Date().toISOString(),
        metadata: {
          component: eventName === "hero.viewed" ? "hero" : "page",
        },
      }).catch((error: unknown) => {
        console.error(`Failed to track ${eventName}:`, error);
      });
    };

    // If IntersectionObserver is unavailable, track immediately.
    if (typeof IntersectionObserver === "undefined") {
      track();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          track();
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [target, eventName, enabled]);
}