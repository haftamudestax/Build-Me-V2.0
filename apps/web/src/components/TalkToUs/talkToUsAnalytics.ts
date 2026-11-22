import { trackEvent } from "../GetQuickWins/ownershipAudit/analytics";

/**
 * Never pass the visitor's name, email or message text here, only counts and
 * labels.
 */
export function trackTalkToUs(
  eventName: string,
  metadata: Record<string, unknown> = {},
): void {
  trackEvent(eventName, metadata, "talk_to_us");
}