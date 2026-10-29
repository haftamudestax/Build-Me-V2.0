import { AnalyticsPage } from "./AnalyticsPage";

export function NavbarAnalyticsPage() {
  return (
    <AnalyticsPage
      title="Navbar Analytics"
      description="Navigation engagement, logo interactions, and navbar events."
      summaryPath="/api/admin/analytics/navbar/kpis"
      eventsPath="/api/admin/analytics/navbar/events"
      supportsDays
    />
  );
}
