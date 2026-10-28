import { AnalyticsPage } from "./AnalyticsPage";

export function MentorMeAnalyticsPage() {
  return (
    <AnalyticsPage
      title="Mentor Me Analytics"
      description="Monitor mentoring requests, form engagement, validation, and submission outcomes."
      summaryPath="/api/admin/analytics/mentor-me/summary"
      eventsPath="/api/admin/analytics/mentor-me/events"
      supportsDays
      supportsEventFilter
    />
  );
}
