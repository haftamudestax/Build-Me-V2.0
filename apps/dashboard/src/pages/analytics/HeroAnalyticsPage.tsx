import { AnalyticsPage } from "./AnalyticsPage";

export function HeroAnalyticsPage() {
  return (
    <AnalyticsPage
      title="Hero Analytics"
      description="Hero section visibility and engagement events."
      summaryPath="/api/admin/analytics/hero/summary"
      eventsPath="/api/admin/analytics/hero/events"
    />
  );
}
