import { AnalyticsPage } from "./AnalyticsPage";

export function OwnershipAuditAnalyticsPage() {
  return (
    <AnalyticsPage
      title="Technology Ownership Audit Analytics"
      description="Monitor audit engagement, answer selections, completion rates, and results viewed across the Build Me website."
      summaryPath="/api/admin/analytics/ownership-audit/summary"
      eventsPath="/api/admin/analytics/ownership-audit/events"
      supportsDays
      supportsEventFilter
    />
  );
}
