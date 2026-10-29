import { AnalyticsPage } from "./AnalyticsPage";

export function CoffeeWithMeAnalyticsPage() {
  return (
    <AnalyticsPage
      title="Coffee With Me Analytics"
      description="Monitor coffee meeting requests, format preferences, form engagement, validation, and booking outcomes."
      summaryPath="/api/admin/analytics/coffee-with-me/summary"
      eventsPath="/api/admin/analytics/coffee-with-me/events"
      supportsDays
      supportsEventFilter
    />
  );
}
