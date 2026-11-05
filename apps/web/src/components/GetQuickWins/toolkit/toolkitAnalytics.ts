import { trackEvent } from "../ownershipAudit/analytics";


export function trackToolkit(
  eventName: string,
  metadata: Record<string, unknown> = {},
): void {
  trackEvent(eventName, metadata, "ownership_toolkit");
}
