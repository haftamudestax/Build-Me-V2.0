import { getAnalyticsConfig } from "@build-me/utils";

/**
 * The current visitor's id: the same one the analytics registration in
 * main.tsx creates, so a message is linked to the same visitor as their
 * analytics events. Returns null until registration has finished (or if it
 * failed).
 */
export function getVisitorId(): string | null {
  const visitorId = getAnalyticsConfig()?.visitorId;

  return typeof visitorId === "string" && visitorId.trim()
    ? visitorId.trim()
    : null;
}