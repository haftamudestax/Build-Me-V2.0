import { trackEvent } from "../ownershipAudit/analytics";

export const LEARNING_CIRCLE_EVENTS = {
  SELECTED: "ownership_learning_circle.selected",
  STARTED: "ownership_learning_circle.started",
  EXPLANATION_VIEWED: "ownership_learning_circle.explanation_viewed",
  JOIN_CLICKED: "ownership_learning_circle.join_clicked",
  TELEGRAM_OPENED: "ownership_learning_circle.telegram_opened",
  BACK_TO_PATHS: "ownership_learning_circle.back_to_paths",
} as const;

export type LearningCircleEventName =
  (typeof LEARNING_CIRCLE_EVENTS)[keyof typeof LEARNING_CIRCLE_EVENTS];

export function trackLearningCircle(
  eventName: string,
  metadata: Record<string, unknown> = {},
): void {
  trackEvent(eventName, metadata, "ownership_learning_circle");
}