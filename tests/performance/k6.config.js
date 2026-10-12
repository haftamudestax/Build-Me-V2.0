const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export const config = {
  baseUrl: BASE_URL,

  endpoints: {
    home: "/",
    login: "/login",
    health: "/health",
  },

  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },

  smoke: {
    vus: 1,
    duration: "10s",
  },

  load: {
    stages: [
      { duration: "30s", target: 5 },
      { duration: "1m", target: 5 },
      { duration: "30s", target: 0 },
    ],
  },

  stress: {
    stages: [
      { duration: "30s", target: 5 },
      { duration: "30s", target: 10 },
      { duration: "30s", target: 20 },
      { duration: "30s", target: 0 },
    ],
  },
};
