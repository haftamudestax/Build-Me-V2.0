import { AnalyticsPage } from "./AnalyticsPage";

export function DeliveryProjectAnalyticsPage() {
  return (
    <AnalyticsPage
      title="Delivery Project Analytics"
      description="Monitor delivery project activity and related events."
      summaryPath="/api/admin/analytics/delivery-project/summary"
      eventsPath="/api/admin/analytics/delivery-project/events"
      supportsDays
      supportsEventFilter
    />
  );
}
