export interface AnalyticsConfig {
  baseUrl: string;
  visitorId: string | null;
  sessionId: string | null;
}

let analyticsConfig: AnalyticsConfig | null = null;

export function configureAnalytics(
  config: AnalyticsConfig,
): void {
  analyticsConfig = config;
}

export function getAnalyticsConfig(): AnalyticsConfig | null {
  return analyticsConfig;
}