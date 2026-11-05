import { trackEvent } from "../ownershipAudit/analytics";

/**
 * Sends a Technology Ownership Toolkit event.
 *
 * Never put personal data (name, email, organisation) in the metadata. Send
 * step numbers and tool ids only.
 */
export function trackToolkit(
  eventName: string,
  metadata: Record<string, unknown> = {},
): void {
  trackEvent(eventName, metadata, "ownership_toolkit");
}
