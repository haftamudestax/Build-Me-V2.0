
import { Router, type Request, type Response } from "express";

import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(requireAuth, requireRole);

const allowedEndpoints = {
  navbarKpis: "/api/reports/navbar/kpis",
  navbarEvents: "/api/events",
  heroSummary: "/api/analytics/hero/summary",
  heroEvents: "/api/analytics/hero/events",
  deliveryProjectSummary: "/api/analytics/delivery-project/summary",
  deliveryProjectEvents: "/api/analytics/delivery-project/events",
  mentorMeSummary: "/api/analytics/mentor-me/summary",
  mentorMeEvents: "/api/analytics/mentor-me/events",
} as const;

type EndpointKey = keyof typeof allowedEndpoints;

const allowedQueryParams: Record<EndpointKey, string[]> = {
  navbarKpis: ["days"],
  navbarEvents: ["limit", "offset"],
  heroSummary: [],
  heroEvents: ["limit", "offset"],
  deliveryProjectSummary: ["days"],
  deliveryProjectEvents: ["limit", "offset", "event_name"],
  mentorMeSummary: ["days"],
  mentorMeEvents: ["limit", "offset", "event_name"],
};

async function proxyAnalytics(
  req: Request,
  res: Response,
  endpoint: EndpointKey,
): Promise<void> {
  const baseUrl = process.env.ANALYTICS_API_URL;
  const adminToken = process.env.ADMIN_API_TOKEN;

  if (!baseUrl || !adminToken) {
    res.status(500).json({
      error: "Analytics service configuration is missing.",
    });
    return;
  }

  let target: URL;

  try {
    target = new URL(allowedEndpoints[endpoint], baseUrl);
  } catch {
    res.status(500).json({
      error: "Analytics service URL is invalid.",
    });
    return;
  }

  for (const key of allowedQueryParams[endpoint]) {
    const value = req.query[key];

    // Accept only a single string value, never arrays or objects.
    if (typeof value === "string") {
      target.searchParams.set(key, value);
    }
  }

  try {
    const upstream = await fetch(target, {
      method: "GET",
      headers: {
        "X-Admin-Token": adminToken,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    const body = await upstream.text();

    res
      .status(upstream.status)
      .type(upstream.headers.get("content-type") ?? "application/json")
      .send(body);
  } catch {
    res.status(502).json({
      error: "Analytics service is unavailable.",
    });
  }
}

router.get("/navbar/kpis", (req, res) =>
  proxyAnalytics(req, res, "navbarKpis"),
);

router.get("/navbar/events", (req, res) =>
  proxyAnalytics(req, res, "navbarEvents"),
);

router.get("/hero/summary", (req, res) =>
  proxyAnalytics(req, res, "heroSummary"),
);

router.get("/hero/events", (req, res) =>
  proxyAnalytics(req, res, "heroEvents"),
);

router.get("/delivery-project/summary", (req, res) =>
  proxyAnalytics(req, res, "deliveryProjectSummary"),
);

router.get("/delivery-project/events", (req, res) =>
  proxyAnalytics(req, res, "deliveryProjectEvents"),
);

router.get("/mentor-me/summary", (req, res) =>
  proxyAnalytics(req, res, "mentorMeSummary"),
);

router.get("/mentor-me/events", (req, res) =>
  proxyAnalytics(req, res, "mentorMeEvents"),
);

export default router;
