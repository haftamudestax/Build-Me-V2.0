/**
 * Sends an event through the same window event main.tsx listens for.
 *
 */
export function trackEvent(
  eventName: string,
  metadata: Record<string, unknown> = {},
  journey: "ownership_audit" | "get_quick_wins"| "ownership_toolkit"| "ownership_learning_circle" = "ownership_audit",
): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("build-me:analytics", {
      detail: { eventName, journey, metadata },
    }),
  );
}
